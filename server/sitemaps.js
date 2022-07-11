sitemaps.add('/sitemap.xml', () => {
	return [
		{ page: '/', changefreq: 'daily' },
		{ page: '/play', changefreq: 'daily' },
		{ page: '/leaderboard', changefreq: 'weekly' },
	];
});