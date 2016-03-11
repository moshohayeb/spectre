module.exports = {
	providers: {
		torrentday: {
			username: process.env.tdUsername,
			password: process.env.tdPassword
		}
	},
	sources: {
		imdb: [
			'/user/ur40260900/watchlist'
		]
	},
	subtitles: {
		language: 'en',
		openSubtitles: {
			username: process.env.osUsername,
			password: process.env.osPassword
		}
	},
	concurrency: 1,
	dlDir: '/Users/moshohayeb/Desktop/Code/spectre/H/',
	tmpDir: '/Users/moshohayeb/Desktop/Code/spectre/movies/',
}
