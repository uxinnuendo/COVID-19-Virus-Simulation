module.exports = function (api) {
  api.cache(true);

	const presets = [
		[
			"@babel/preset-env",
			{
				"targets": {
					"browsers": ["> 1%", "last 2 versions", "not ie <= 8", "ie >= 11"]
				}
			},
		]
	];

	const plugins = [
		"@babel/plugin-transform-runtime"
	]

  return {
  	plugins,
		presets
  };
};
