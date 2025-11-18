<?php
/**
 * Registrierung des Blank-Blocks
 */

defined('ABSPATH') || exit;

function ud_register_blank_block() {
    // Hauptblock registrieren (liest automatisch block.json im Plugin-Hauptverzeichnis)
    register_block_type_from_metadata(__DIR__ . '/../');
}

add_action('init', 'ud_register_blank_block');

// Eigene Kategorie "UD Blocks" hinzufügen, falls sie noch nicht existiert
add_filter(
    'block_categories_all',
    function ( $categories, $post ) {
        foreach ( $categories as $cat ) {
            if ( $cat['slug'] === 'ud-blocks' ) {
                return $categories; // Kategorie existiert bereits
            }
        }

        $categories[] = [
            'slug'  => 'ud-blocks',
            'title' => __( 'UD Blocks', 'ud-blank-block-ud' ),
        ];

        return $categories;
    },
    10,
    2
);
