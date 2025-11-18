<?php
/**
 * Hilfsfunktionen für den Blank-Block
 */
defined('ABSPATH') || exit;

/**
 * Gibt die Version des Plugins zurück (z. B. für Cache-Busting).
 *
 * @return string
 */
function ud_blank_block_version() {
    return '1.0.0';
}

function ud_show_login_status() {
    if ( is_user_logged_in() ) {
        $user = wp_get_current_user();
        return 'Eingeloggt als: <strong>' . esc_html( $user->display_name ) . '</strong>';
    }
    return 'Du bist nicht eingeloggt.';
}
add_shortcode( 'login_status', 'ud_show_login_status' );
