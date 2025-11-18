<?php
if (!defined('ABSPATH')) exit;

/**
 * Liefert die vollständige Tabellenstruktur.
 * Falls später Spalten dazukommen → einfach hier ergänzen.
 */
function ud_notes_get_table_schema() {
    global $wpdb;

    $table = $wpdb->prefix . 'ud_notes';

    return [
        'table' => $table,
        'columns' => [
            'id'         => 'INT UNSIGNED NOT NULL AUTO_INCREMENT',
            'parent_id'  => 'INT UNSIGNED DEFAULT 0',
            'message'    => 'TEXT NOT NULL',
            'author'     => 'VARCHAR(200) DEFAULT \'\'',
            'created_at' => 'DATETIME NOT NULL',
            'is_done'    => 'TINYINT(1) DEFAULT 0'
        ],
        'primary_key' => 'PRIMARY KEY (id)'
    ];
}

/**
 * Erstellt Tabelle vollständig (nur bei Plugin-Aktivierung).
 */
function ud_notes_install_table() {
    global $wpdb;
    $schema = ud_notes_get_table_schema();

    $table = $schema['table'];
    $charset = $wpdb->get_charset_collate();

    // Grundstruktur für dbDelta vorbereiten
    $columns_sql = [];
    foreach ($schema['columns'] as $name => $type) {
        $columns_sql[] = "$name $type";
    }

    $columns_sql = implode(",\n", $columns_sql);

    $sql = "
        CREATE TABLE $table (
            $columns_sql,
            {$schema['primary_key']}
        ) $charset;
    ";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta($sql);
}

/**
 * Prüft bei jedem Plugin-Load:
 * - Existiert die Tabelle? Wenn nein → erstellen.
 * - Fehlen Spalten? Wenn ja → ergänzen.
 */
function ud_notes_check_table_schema() {
    global $wpdb;
    $schema = ud_notes_get_table_schema();
    $table = $schema['table'];

    // Prüfen, ob Tabelle existiert
    $exists = $wpdb->get_var(
        $wpdb->prepare("SHOW TABLES LIKE %s", $table)
    );

    if ($exists !== $table) {
        // Tabelle fehlt komplett → neu erstellen
        ud_notes_install_table();
        return;
    }

    // Existierende Spalten abfragen
    $existing_cols = $wpdb->get_col("SHOW COLUMNS FROM $table");

    // Fehlende Spalten hinzufügen
    foreach ($schema['columns'] as $col => $definition) {
        if (!in_array($col, $existing_cols, true)) {
            $wpdb->query("ALTER TABLE $table ADD COLUMN $col $definition;");
        }
    }
}

/**
 * Einzelne Note aus DB holen (für Create/Reply).
 */
function ud_notes_get_note_by_id($id) {
    global $wpdb;
    $table = $wpdb->prefix . 'ud_notes';

    return $wpdb->get_row(
        $wpdb->prepare("SELECT * FROM $table WHERE id = %d", $id)
    );
}