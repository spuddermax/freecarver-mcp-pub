// babel.config.js

export default {
	presets: [
		[
			"@babel/preset-env",
			{
				targets: {
					node: "current", // Ensures compatibility with the current Node version
				},
			},
		],
	],
};
