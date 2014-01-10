<?php

class InkwellFeedManagerBumper {

		function __construct(){
			//$this->sweep_intervals();
		}

		function sweep_intervals(){
			$go = get_transient('bumper-sweeper');
			if ($go === false){
				$this->sweep_views(500);
				set_transient('bumper-sweeper', true, 3600);
			}
		}

		function sweep_views($interval = 500){
			global $wpdb;
			$table = $wpdb->prefix . 'popularpostsdata';
			$query = "SELECT postid as 'ID', pageviews AS 'count' FROM {$table} WHERE last_viewed > DATE_SUB(NOW(), INTERVAL 30 MINUTE) AND pageviews > {$interval}";
			$results = $wpdb->get_results($query);
			$this->bump_feeds($results, 'views', $interval);
		}

		function get_result_count($results, $ID){
			foreach($results as $result){
				if ($result->ID == $ID){
					return $result->count;
				}
			}
			return 0;
		}

		function bump_feeds($results, $col = 'views', $interval = 10){
			$pids = array();
			foreach($results as $result){
				$pids[] = $result->ID;
			}
			$colname = 'bumped_'.$col;
			$feeds = InkwellFeedManager::get_feeds();
			foreach($feeds as $feed){
				$items = $feed->get_posts('posts', $pids);
				foreach($items as $ifi){
					$bumps = 1;
					if (isset($ifi->$colname)){
						$result_count = get_result_count($results, $ifi->ID);
						if ($result_count - $interval > $ifi->$colname){
							$feed->bump_post($ifi->ID, $bumps);
							$ifi->update($ifi->ID, $colname, $result_count + $interval);
						}
					} else {
						$feed->bump_post($ifi->ID, $bumps);
						$feed->update_ifi_meta($ifi->ID, $colname , $interval);
					}
				}
			}

		}
	}

	$ifb = new InkwellFeedManagerBumper();
