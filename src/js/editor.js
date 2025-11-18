/**
 * editor.js
 *
 * JavaScript für den Block-Editor (Gutenberg).
 * Wird ausschließlich im Backend geladen.
 *
 * Hinweis:
 * Diese Datei enthält editor-spezifische Interaktionen oder React-Komponenten.
 * Wird über Webpack zu editor.js gebündelt und in block.json oder enqueue.php eingebunden.
 */

import edit from "./edit";
import metadata from "../../block.json";

// Registrierung des Blocks über die Metadaten
wp.blocks.registerBlockType(metadata.name, {
	...metadata,
	edit,
	save: () => null, // kein statisches Speichern – nutzt serverseitiges Rendern oder dynamische Logik
});
