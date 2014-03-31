chainsaw-feed
=============

The infamous Feed Manager. By @upstatement

### Setup
* Requires [Timber](https://github.com/jarednova/timber)
* Install `chainsaw-feed` in your Plugins directory. Activate plugin
* Go to the WordPress admin and look for "Feeds". Create a new Feed and give it a name. Don't worry about any other setting.
* Note the ID number. (Represented below as `1234`)
* In your `functions.php` initalize your feed like so:

```php

	/* functions.php */

	if (class_exists('ChainsawFeed') && class_exists('ChainsawFeedManager')){
		$hlrFeed = new ChainsawFeed(1234);
		// These are optional:
		$hlrFeed->zones['pinned']['title'] = 'Homepage slider';
		$hlrFeed->zones['pinned']['desc'] = 'This should contain 4-6 stories';
		$hlrFeed->zones['unpinned']['title'] = 'Homepage grid';
		$hlrFeed->zones['pinned']['desc'] = 'This should contain 4-6 stories';
		// Should newly published stories automaticaly appear at the top fo the unpinned section? Defaults to true.
		$hlrFeed->push_to_feed = false;
		// What post types are managed by this feed?
		$hlrFeed->set_post_types(array('post', 'event', 'roundtable'));
		$hlrFeedManager = new ChainsawFeedManager($hlrFeed);
		// What taxonomy is used to show on the left? Defaults to 'category', but you can also use 'post_tag' or a custom taxonomy
		$hlrFeedManager->default_taxonomy = 'category';
	}
```


### Usage
```php
	/* home.php */

	$hp_feed = new ChainsawFeed(1234);
	$posts = $hp_feed->get_posts();
	$context['hp_posts'] = $posts;
	Timber::render('home.twig', $context);
```

