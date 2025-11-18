<?php
/**
 * Plugin Name:     UD Block: Notes
 * Description:     Live synchronisierte Notizzettel (Post-It) für das Frontend der Suppenanstalt.
 * Version:         1.0.0
 * Author:          ulrich.digital gmbh
 * Author URI:      https://ulrich.digital/
 * License:         GPL v2 or later
 * License URI:     https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:     ud-notes-ud
 */
error_log("🔥 HAUPTDATEI läuft aus: " . __FILE__);

if (!defined('ABSPATH')) exit;

// ------------------------------------------------------
// 1) Basis-Pfade
// ------------------------------------------------------

define('UD_NOTES_DIR', plugin_dir_path(__FILE__));
define('UD_NOTES_URL', plugin_dir_url(__FILE__));

// ------------------------------------------------------
// 2) Ably-Key Helper (WICHTIG: muss vor API-Includes stehen)
// ------------------------------------------------------
function ud_notes_get_ably_key() {

    // 1) Globale Konstante (falls verwendet)
    if (defined('ABLY_API_KEY') && ABLY_API_KEY) {
        return ABLY_API_KEY;
    }

    // 2) Gleiche Option wie UD Reservation Plugin
    $key = get_option('ud_reservation_ably_key');
    if ($key) return $key;

    // 3) Optional: Fallback für Notes (falls definiert)
    if (defined('UD_NOTES_ABLY_KEY')) {
        return UD_NOTES_ABLY_KEY;
    }

    return null;
}


// ------------------------------------------------------
// 3) Includes laden (jetzt ist Ably-Funktion verfügbar)
// ------------------------------------------------------
/*require_once UD_NOTES_DIR . 'includes/db.php';
require_once UD_NOTES_DIR . 'includes/api-register.php';
require_once UD_NOTES_DIR . 'includes/enqueue.php';
require_once UD_NOTES_DIR . 'includes/helpers.php';
*/


foreach ([
    'db.php',
    'api-register.php',
    'enqueue.php',
    'helpers.php'
] as $file) {
    require_once __DIR__ . '/includes/' . $file;
}

// ------------------------------------------------------
// 4) INSTALLATION: Tabelle bei Aktivierung erstellen
// ------------------------------------------------------
register_activation_hook(__FILE__, 'ud_notes_install_table');

// ------------------------------------------------------
// 5) UPGRADE-SAFE CHECK: Bei jedem Plugin-Load ausführen
// ------------------------------------------------------
add_action('plugins_loaded', 'ud_notes_check_table_schema');
