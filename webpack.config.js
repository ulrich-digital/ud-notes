/*
 * Erweiterte Webpack-Konfiguration für WordPress-Block-Plugins
 * (z. B. für zusätzliche Einträge und SVG-Handling).
 *
 * ⚙️ Hinweis:
 * Diese Datei wird **nur verwendet**, wenn sie in der package.json explizit angegeben ist:
 *
 * "scripts": {
 *   "build": "webpack --config webpack.config.js",
 *   "start": "webpack --watch --config webpack.config.js"
 * }
 *
 * Wenn du diese Angabe weglässt, verwendet WordPress standardmässig
 * die interne Konfiguration von @wordpress/scripts – diese Datei wird dann ignoriert.
 */

const defaultConfig = require("@wordpress/scripts/config/webpack.config");
const path = require("path");

// Entferne die ursprüngliche Regel für SVG-Dateien aus der Standardkonfiguration.
// Dadurch vermeiden wir Konflikte und können eigene Optionen (z. B. SVGR) definieren.
const filteredRules = defaultConfig.module.rules.filter(
	(rule) => !rule.test?.toString().includes("svg")
);


module.exports = {
	...defaultConfig,

	// Explizite Einträge für Editor/Frontend (JS & SCSS)
	entry: {
		'editor-script': path.resolve(__dirname, "src/js/editor.js"),
		'frontend-script': path.resolve(__dirname, "src/js/frontend.js"),
		'editor-style': path.resolve(__dirname, "src/css/editor.scss"),
		'frontend-style': path.resolve(__dirname, "src/css/frontend.scss"),
	},
	output: {
		path: path.resolve(__dirname, "build"),
		filename: "[name].js",
	},
	module: {
		rules: [
			...filteredRules,

			/*
			 * 🔧 Eigene SVG-Behandlung:
			 * SVG-Dateien werden mit @svgr/webpack als React-Komponenten importiert,
			 * statt als statische Dateien. Dadurch können sie direkt im JSX verwendet werden:
			 *
			 *   import { ReactComponent as Icon } from "../assets/icons/star.svg";
			 *   <Icon />
			 *
			 * Das ist besonders nützlich für Gutenberg-Icons oder UI-Komponenten.
			 */
			{
				test: /\.svg$/i,
				issuer: /\.[jt]sx?$/,
				use: [
					{
						loader: '@svgr/webpack',
						options: { icon: true },
					},
				],
			},
		],
	},
};
