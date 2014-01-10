<?php
if (is_dir(ABSPATH.'wp-content/plugins/timber')){
	include_once(ABSPATH.'wp-content/plugins/timber/timber.php');
} else if (is_dir(ABSPATH.'wp-content/plugins/timber-library/')){
	include_once(ABSPATH.'wp-content/plugins/timber-library/timber.php');
}

class ChainsawFeed extends TimberPost {

	//stored as array
	var $length = 250;
	var $ID = false;
	var $post_type = 'feeds';

	var $view_interval = 150;

	function __construct($pid = null, $args = array()){
		if ($pid === null){
			$feeds = Timber::get_posts('feeds#feed-homepage');
			if(count($feeds)) {
				$this->ID = $feeds[0]->ID;
			} else {
				$feeds = get_posts(array('post_type' => 'feeds'));
				if (is_array($feeds) && count($feeds)){
					$this->ID = $feeds[0]->ID;
				}
			}
		} else {
			$this->ID = $pid;
		}
		if (!isset($this->ID)){
			Jigsaw::show_notice('No Feeds found');
		}
		$this->init($pid);
		add_action('wp_enqueue_script', array($this, 'load_scripts'));
		add_action('add_meta_boxes', array($this, 'add_feed_boxes'));
		$this->import_custom($this->ID);
		$this->bumper_sweep_posts();
		$this->import($args);
	}

	function set_post_types($post_types = 'post'){
		if (is_string($post_types)){
			$post_types = array($post_types);
		}
		//test for identical arrays
		if ($post_types !== $this->query_post_type){
			$this->update('query_post_type', $post_types);
		}
	}

	function get_length($scope = 'any'){
		if($this->ID) {
			$pinned = get_post_meta($this->ID, 'pinned', true);
			$posts = get_post_meta($this->ID, 'posts', true);
			if (!is_array($pinned)){
				$pinned = array();
			}
			if (!is_array($posts)){
				$posts = array();
			}
			if ($scope == 'any' || $scope == 'all'){
				return count(array_merge($pinned, $posts));
			} else if ($scope == 'posts'){
				return count($posts);
			} else if ($scope == 'pinned'){
				return count($pinned);
			}
			return 0;
		}
	}

	function get_posts($scope = 'any', $count = 0, $offset = 0, $PostClass = 'TimberPost') {
		if($this->ID) {
			return $this->get_feed_contents($scope, $count, $offset, $PostClass);
		}
		return Timber::get_posts(false, $PostClass);
	}

	function get_pids($scope = 'any', $count = 0, $offset = 0){
		$pids = array();
		if($this->ID) {
			$posts = $this->get_feed_contents($scope, $count, $offset);
			foreach($posts as $post){
				$pids[] = $post->ID;
			}
		}
		return $pids;
	}

	function get_feed_contents($scope = 'all', $count = 24, $offset = 0, $PostClass = 'TimberPost') {
		$scopes = array();
		if ($scope == 'all' || $scope == 'any'){
			$scopes = array('pinned', 'posts');
		} else if (is_string($scope)) {
			$scopes = array($scope);
		} else if (is_array($scope)){
			$scopes = $scope;
		}
		$pids = array();
		foreach($scopes as $scope){
			$arr = get_post_meta($this->ID, $scope, true);
			if (is_array($arr)){
				$pids = array_merge($pids, $arr);
			}
		}
		$pids = array_unique($pids);
		if ($count){
			$pids = array_splice($pids, $offset, $count);
		}
		$timbers = array();
		if (count($pids)){
			$timbers = Timber::get_posts($pids, $PostClass);
			foreach($timbers as $key=>$timber){
				if ($timber->post_status != 'publish'){
					unset($timbers[$key]);
				}
			}
		}
		return $timbers;
	}

	function init($pid = false){
		if ($this->ID){
			parent::init($this->ID);
		} else {
			error_log('ID not set in InkwellFeed:init');
		}
	}

	function load_scripts(){
		wp_enqueue_script('ios-checkboxes', plugin_dir_url(__FILE__).'libs/ios-checkbox/jquery/iphone-style-checkboxes.js', array('jquery'), false, true );
		wp_enqueue_style('ios-checkboxes-style', plugin_dir_url(__FILE__).'libs/ios-checkbox/style.css');
		wp_enqueue_script('inkwell-feed', plugin_dir_url(__FILE__).'/js/inkwell-feed.js', array('jquery', 'ios-checkboxes'));
	}

	function add_feed_boxes(){
		add_meta_box('feed-manager', 'Feed Name Here', array(&$this, 'feed_manager_inner'), 'feeds', 'normal');
		add_meta_box('feed-query', 'Feed Post Types', array(&$this, 'feed_manager_query'), 'feeds', 'side');
	}

	function save_post($pid){
		if (wp_is_post_revision( $pid ) || wp_is_post_autosave($pid)){
			return;
		}
		$this->ID = $pid;
		if (isset($_POST['pids'])){
			$this->save_items($_POST);
		}
		if (isset($_POST['query_post_type'])){
			$this->save_query($_POST['query_post_type']);
		}
	}

	function save_query($post_types){
		if (!isset($post_types)){
			return false;
		}
		$this->update('query_post_type', $post_types);
	}

	function save_items($form){
		$saver = array();
		$i = 0;
		$pids = $form['pids'];
		$saver['posts'] = array();
		$saver['pinned'] = array();
		foreach($pids as $pid){
			if (isset($form['post_hidden_'.$pid])){
				$hidden = $form['post_hidden_'.$pid];
				update_post_meta($pid, 'post_hidden', $hidden);
			}
			if (isset($form['post_scope_'.$pid])){
				$scope = $form['post_scope_'.$pid];
				if (!$scope){
					error_log('sorry, no scope on '.$pid);
					$scope = 'posts';
				}
				$saver[$scope][] = $pid;
			}
			if (isset($form['tease_size_'.$pid])){
				$tease_size = $form['tease_size_'.$pid];
				update_post_meta($pid, 'tease_size', $tease_size);
			}
		}
		foreach($saver as $scope=>$pids){
			if (strlen(trim($scope))){
				if (!count($pids) && $scope == 'posts'){
					// you cannot update with empty posts; only empty pinned
				} else {
					$this->update($scope, $pids);
				}
			}
		}
	}

	function feed_manager_inner($post){
		$context = array();
		$context['pinned'] = $this->get_posts('pinned');
		$context['posts'] = $this->get_posts('posts');
		$context['feed'] = new TimberPost($this->ID);
		Timber::render('feed-stream.twig', $context);
		Timber::render('search.twig');
	}

	function feed_manager_query(){
		$context = array();
		$post_types = get_post_types(array('public' => true), 'names');
		$context['post_types'] = array();
		foreach($post_types as $post_type){
			$pti = get_post_type_object($post_type);
			$pti->checked = '';
			if (in_array($post_type, $this->query_post_type)){
				$pti->checked = 'checked';
			}
			if ($post_type != $this->post_type) {
				$context['post_types'][] = $pti;
			}
		}
		Timber::render('feed-query.twig', $context);
	}

	function get_query_post_types($method = 'object'){
		if (!isset($this->query_post_type)){
			$this->import_custom($this->ID);
			if (!isset($this->query_post_type)){
				return null;
			}
		}
		return $this->query_post_type;
	}

	function in_query($pid){
		$query = array();
		$query['post_type'] = $this->get_query_post_types();
		$query['numberposts'] = $this->length;
		error_log('query for '.$this->post_title);
		TimberHelper::error_log($query);
		$qr = get_posts($query);
		foreach($qr as $qp){
			if ($pid == $qp->ID){
				return true;
			}
		}
		return false;
	}

	function bump_post($pid, $spots = 1){
		return;
		error_log('bump_post');
		$posts = $this->get_pids('posts', 9999);
		$bumper;
		$i = 0;
		foreach($posts as $post){
			if ($post == $pid){
				break;
			}
			$i++;
		}
		$item = $posts[$i];
		$target_index = $i - $spots;
		$posts[ $i ] = $posts[ $target_index];
		$posts[ $target_index ] = $item;
		update_post_meta($this->ID, 'posts', $posts);
	}

	function add_post($pid) {
		$pids = $this->get_pids('posts');
		array_unshift($pids, $pid);
		$pids = array_unique($pids);
		if (!empty($pids)){
			update_post_meta($this->ID, 'posts', $pids);
		} else {
			error_log('Error trying to add '.$pid.' to feed');
		}
	}

	function bumper_sweep_posts(){
		return;
		$transient = get_transient( 'feed_bumper' );
		if ($transient){
		   	return;
		}
		error_log('bumper '.$transient);
   		// Handle the false if you want
		set_transient('feed_bumper', 'ready', 30*60 );
		if (isset(InkwellVars::$feed_view_interval)){
			$this->view_interval = InkwellVars::$feed_view_interval;
		}
		if ($this->view_interval == 0){
			//not gonna do it
			return;
		}
		$posts = $this->get_posts('posts');
		foreach($posts as $post){
			if (!isset($post->next_view_threshold)){
				$post->update('next_view_threshold', $this->view_interval);
			}
			$views = InkwellPopular::get_post_views($post->ID);
			if ($post->next_view_threshold > $views){
				continue;
			}
			$post->update('next_view_threshold', $post->next_view_threshold + $this->view_interval);
			$this->bump_post($post->ID, 1);
		}
	}
}

if (is_admin()){
	$pid = null;
	if (isset($_GET['post']) && !is_array($_GET['post'])){
		$pid = $_GET['post'];
	} else if (isset($_POST['post_ID'])) {
		$pid = $_POST['post_ID'];
	}
	if ($pid){
		$maybe_feed_post = Timber::get_post($pid);
		if (isset($maybe_feed_post) && isset($maybe_feed_post->post_type) && $maybe_feed_post->post_type == 'feeds'){
			$ChainsawFeed = new ChainsawFeed($pid);
		}
	}
}
