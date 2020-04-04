import { corona } from './corona.js'

(function() {
'use strict';

	function ready() {
		return new Promise(function(resolve, reject) {
			document.addEventListener('readystatechange', function() {
				if(document.readyState !== 'loading') {
					resolve();
				}
			});
		});
	};

	ready().then(function() {
		corona.run();
	});

})()