<?php
/**
 * Enqueue von Styles und Scripts für den Blank-Block
 */

if (!defined('ABSPATH')) exit;

add_action('wp_enqueue_scripts', function () {

    // Wenn nicht eingeloggt → keine Notes-Funktion
    if (!is_user_logged_in()) {
        return;
    }

    // ---------------------------------------------------
    // Ably SDK
    // ---------------------------------------------------
    wp_enqueue_script(
        'ably',
        'https://cdn.ably.io/lib/ably.min-1.js',
        [],
        null,
        true
    );

    // ---------------------------------------------------
    // Styles
    // ---------------------------------------------------
    wp_enqueue_style(
        'ud-notes-frontend-style',
        UD_NOTES_URL . 'build/frontend-style.css',
        [],
        filemtime(UD_NOTES_DIR . 'build/frontend-style.css')
    );

    // ---------------------------------------------------
    // Frontend Script
    // ---------------------------------------------------
    wp_enqueue_script(
        'ud-notes-frontend-script',
        UD_NOTES_URL . 'build/frontend-script.js',
        ['ably'],
        filemtime(UD_NOTES_DIR . 'build/frontend-script.js'),
        true
    );

    // ---------------------------------------------------
    // Localized Script (REST, Nonce, Ably)
    // ---------------------------------------------------
    wp_localize_script('ud-notes-frontend-script', 'UD_NOTES', [
        'rest' => [
            'create' => rest_url('ud-notes/v1/create'),
            'reply'  => rest_url('ud-notes/v1/reply'),
            'done'   => rest_url('ud-notes/v1/done'),
            'all'    => rest_url('ud-notes/v1/all'),
        ],
        'ably_key' => "xzrNUA.Bcq1Kw:objmvcZGq8X_XI9YA-ZHRUVXtbMzVHFnooRoaP46A84",
        'nonce'    => wp_create_nonce('wp_rest'),
    ]);
});

