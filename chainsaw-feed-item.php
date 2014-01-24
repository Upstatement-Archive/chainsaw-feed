<?php

/*
	ChainsawFeedItem represent the original post that feed items spawn from.
*/

// when an item is saved
// check to see if it's feed-friendly
// if so, check to see if it's IN the feed already
// if not, add it's PID to the feed-homepage meta?

class ChainsawFeedItem {

	var $post = false;
	var $post_meta = false;
	var $feedable = false;

	function __construct($pid = false){ // $pid = null
		if($pid) {
			if(is_object($pid)) {
				$this->post = $pid;
			}
			$this->post = get_post($pid);
			$this->post_meta = get_post_custom($pid);
			$this->feedable = isset($this->post_meta['is_feedable']) ? $this->post_meta['is_feedable'][0] : false;
		}
		add_action('save_post', array(&$this, 'save_post'));
		add_action('wp_ajax_manually_send_post_to_feeds', array(&$this, 'ajax_send_post_to_feeds'));
		add_action('post_submitbox_misc_actions', array(&$this, 'add_feed_checkbox'));
	}

	function ajax_send_post_to_feeds(){
		$pid = intval($_POST['pid']);
		$feed = new ChainsawFeed();
		$feed->add_post($pid);
		update_post_meta($pid, 'offered_to_feed', true);
	}

	function add_feed_checkbox(){
		if (isset($this->post->post_type) && $this->post->post_type == 'feeds'){
			return;
		}
		$checked = '';
		if ($this->feedable || !$this->post){
			$checked = 'checked="checked"';
		}
		echo '<div class="misc-pub-section" id="chainsaw-offer-to-feeds">';
		echo '<input type="checkbox" name="is_feedable" id="is_feedable" '.$checked.'/>';
		echo ' <label for="is_feedable">Make available to Feeds <small>Please note: if this post is already in a feed, you must remove it in Feed Manager. You can also </small> <a href="#send-to-feeds">manually send to feeds</a>.</label>';
		echo '</div>';
	}

	function save_post($pid = false, $force_feed = false) {
		if (wp_is_post_revision($pid) || wp_is_post_autosave($pid)){
			return $pid;
		}

		if (!isset($_POST['post_status']) || $_POST['post_status'] != 'publish'){
			return $pid;
		}
		if (isset($_POST['is_feedable']) || $force_feed){
			$this->feedable = true;
			$offered = (isset($this->post_meta['offered_to_feed']) ? $this->post_meta['offered_to_feed'] : false);

			if($offered == true) {
				return $pid;
			}
			if( $offered == false) {
				$query = array('post_type' => array('feed', 'feeds'));
				$feeds = Timber::get_posts($query, 'ChainsawFeed');
				foreach($feeds as $feed){
					if ($feed->in_query($pid)){
						$feed->add_post($pid);
					}
				}
			}
			update_post_meta($pid, 'offered_to_feed', true);
		} else {
			$this->feedable = false;
		}
		update_post_meta($pid, 'is_feedable', $this->feedable);
		return $pid;
	}
}

if (is_admin()){
	$url = TimberHelper::get_current_url();
	if (strstr($url, 'admin-ajax')){
		return;
	}
	$pid = null;
	if (isset($_GET['post'])){
		$pid = $_GET['post'];
	} else if (isset($_POST['post_ID'])) {
		$pid = $_POST['post_ID'];
	}
	if (!wp_is_post_revision($pid)){
		$chainsawFeedItem = new ChainsawFeedItem($pid);
	}
}
