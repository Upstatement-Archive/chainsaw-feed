<?php

	/*
	Plugin Name: Chainsaw Feed Manager
	Plugin URI: http://inkwell.upstatement.com/plugins/inkwell-manager
	Description: Integrates the syncing of a dynamic feed with WordPress
	Version: 0.2
	Author: Jared Novack + Upstatement
	*/
	// TimberHelper::error_log($_POST);
	define( 'PLUGIN_PATH', plugin_dir_path(__FILE__) );

	require_once(__DIR__.'/chainsaw-feed.php');
	require_once(__DIR__.'/chainsaw-feed-item.php');

	class ChainsawFeedManager {

		var $page_slug = 'feed_manager';
		var $default_taxonomy = 'category';
		var $intervals;

		function __construct($chainsawFeeds = false){
			if ($chainsawFeeds && !is_array($chainsawFeeds)){
				$chainsawFeeds = array($chainsawFeeds);
			}
			if ($chainsawFeeds) {
				$this->feeds = $chainsawFeeds;
			}
			add_action('init', array($this, 'on_init'));
			add_action('init', array($this, 'process_post_data'));
			add_action('admin_menu', array($this, 'add_options_page'));
			add_filter('get_twig', array($this, 'add_to_twig'));
			add_action('wp_ajax_chainsaw_query_posts', array($this, 'query_posts'));
		}

		function __construct_old($post_ids, $post_types){
			$intervals = new stdClass();
			$intervals->views = 500;
			$intervals->comments = 5;
			$intervals->shares = 5;
		}

		function query_posts(){
			$query = $_POST['query'];
			$format = 'json';
			if (isset($_POST['format'])){
				$format = $_POST['format'];
			}
			if (strlen($query) < 3){
				return 'no';
			}
			global $wpdb;
			$and_post_types = '';
			if (isset($this->feeds) && is_array($this->feeds) && count($this->feeds)){
				$post_types = $this->feeds[0]->query_post_type;
				if (is_array($post_types)){
					foreach($post_types as &$pt){
						$pt = "'".$pt."'";
					}
					$post_types = implode(', ', $post_types);
				}
				$and_post_types = "AND post_type IN ($post_types)";
			}

			$query = ("SELECT ID from $wpdb->posts WHERE post_title LIKE '%$query%' AND post_status = 'publish' $and_post_types ORDER BY ID DESC LIMIT 24");
			error_log($query);
			$results = $wpdb->get_col($query);
			$posts = Timber::get_posts($results);
			if ($format == 'html'){
				foreach($posts as $post){
					$data['post'] = $post;
					$data['tease_sizes'] = InkwellVars::$tease_sizes;
					Timber::render('feed-post-stub.twig', $data);
				}
			} else {
				echo json_encode($posts);
			}
			die();
		}

		function process_post_data(){
			error_log('process_post_data');
			if(isset($_POST['ink_page_name']) && $_POST['ink_page_name'] == 'feed_manager') {
				TimberHelper::error_log($_POST);
				$this->save_feed($_POST['pid']);
			}
		}

		function add_to_twig($twig){
			/* this is where you can add your own fuctions to twig */
			$twig->addFilter('ink_tease_slug_to_name', new Twig_Filter_Function(function($slug){
				$slug = trim($slug);
				if (class_exists('InkwellVars')){
					$inkTeases = InkwellVars::$tease_sizes;
				}
				if (isset($inkTeases) && is_array($inkTeases)){
					foreach($inkTeases as $tease){
						if ($tease['slug'] == $slug){
							return $tease['name'];
						}
					}
				}
				return $slug;
			}));
			return $twig;
		}

		function add_options_page() {
			add_menu_page('Feed Manager', 'Feed Manager', 'edit_posts', 'feed_manager_settings', array($this, 'options_page'), '/wp-content/plugins/wp-admin-icons/icons/arrow-join-090.png');
		}

		function get_recent_posts_for_feed($feed){
			$args = array('numberposts' => 8, 'orderby' => 'modified');
			$args['post_type'] = $feed->query_post_type;
			return Timber::get_posts($args);
		}

		function options_page(){
			$time_pre = microtime(true);
			$feed = $this->get_feed();
			$context = array();
			$post_types = get_post_types(array('public' => true));
			$context['post_types'] = array();
			$context['feeds'] = $this->get_feeds();
			foreach($post_types as $pt){
				$context['post_types'][] = get_post_type_object($pt);
			}
			$context['post_types'] = $this->filter_post_types($feed->ID, $context['post_types']);
			$context['lists'] = array();
			$recent_posts = $this->get_recent_posts_for_feed($feed);
			$recent = array('posts'=>$recent_posts, 'name' => 'Recently Updated');
			$context['lists'][] = $recent;
			if (class_exists('InkwellVars')){
				$context['tease_sizes'] = InkwellVars::$tease_sizes;
			}
			$context['lists'] = apply_filters('ink_feeds_lists', $context['lists']);
			$context['feed'] = $feed;
			$cats = Timber::get_terms($this->default_taxonomy);
			foreach($cats as $cat){
				$cat->posts = $cat->get_posts(6);
				$context['lists'][] = $cat;
			}
			$context['pinned'] = $feed->get_posts('pinned', 0, 0);
			$context['posts'] = $feed->get_posts('posts', 0, 0);
			Timber::render('feed-manager.twig', $context);
			$time_post = microtime(true);
			$exec_time = $time_post - $time_pre;
			wp_enqueue_script('jquery-ui-core');
			wp_enqueue_script('jquery-ui-sortable');
			//echo '<div style="text-align:center">'.$exec_time.'</div>';
		}

		function filter_post_types($pid, $post_types){

			$feed = new ChainsawFeed($pid);
			$query = $feed->get_query_post_types();
			foreach($post_types as $post_type){
				if (in_array($post_type->name, $query)){
					$post_type->in_query = true;
				}
			}
			return $post_types;

		}

		function save_feed($pid){
			$feed = new ChainsawFeed($pid);
			$feed->save_post($pid);
		}

		function create_post_type(){
			register_post_type('feeds',
				array(	'label' => 'Feeds',
						'description' => '',
						'public' => true,
						'show_ui' => true,
						'show_in_menu' => false,
						'capability_type' => 'page',
						'hierarchical' => false,
						'rewrite' => array('slug' => ''),
						'query_var' => true,
						'has_archive' => false,
						'exclude_from_search' => true,'supports' => array('title'),'labels' => array (
				  'name' => 'Feeds',
				  'singular_name' => 'Feed',
				  'menu_name' => 'Feeds',
				  'add_new' => 'Add Feed',
				  'add_new_item' => 'Add New Feed',
				  'edit' => 'Edit',
				  'edit_item' => 'Edit Feed',
				  'new_item' => 'New Feed',
				  'view' => 'View Feed',
				  'menu_position' => 55,
				  'view_item' => 'View Feed',
				  'search_items' => 'Search Feeds',
				  'not_found' => 'No Feeds Found',
				  'not_found_in_trash' => 'No Feeds Found in Trash',
				  'parent' => 'Parent Feed',
				),) );
		}

		function on_init(){
			$this->create_post_type();
			if (is_home()){
				Jigsaw::add_toolbar_item('Edit Feed', '/wp-admin/admin.php?page=feed_manager_settings');
			}
		}

		function get_feed(){
			if (isset($_GET['pid'])){
				$pid = $_GET['pid'];
				return new ChainsawFeed($pid);
			}
			$feeds = $this->get_feeds();
			return $feeds[0];
		}

		function get_feeds(){
			if (isset($this->feeds) && is_array($this->feeds)){
				return $this->feeds;
			}
			return array();
		}

	}
