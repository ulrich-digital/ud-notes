<?php
if (!defined('ABSPATH')) exit;

/**
 * UD Notes – REST API
 *
 * Endpunkte:
 *  - POST /create
 *  - POST /reply
 *  - POST /done
 *  - GET  /all
 */

add_action('rest_api_init', function () {

   register_rest_route('ud-notes/v1', '/create', [
    'methods'  => 'POST',
    'callback' => 'ud_notes_create',
    'permission_callback' => function () {
        return current_user_can('read');
    }
]);

register_rest_route('ud-notes/v1', '/reply', [
    'methods'  => 'POST',
    'callback' => 'ud_notes_reply',
    'permission_callback' => function () {
        return current_user_can('read');
    }
]);

register_rest_route('ud-notes/v1', '/done', [
    'methods'  => 'POST',
    'callback' => 'ud_notes_done',
    'permission_callback' => function () {
        return current_user_can('read');
    }
]);

register_rest_route('ud-notes/v1', '/all', [
    'methods'  => 'GET',
    'callback' => 'ud_notes_get_all',
    'permission_callback' => function () {
        return current_user_can('read');
    }
]);


});

/**
 * Hilfsfunktion: korrekten Usernamen zurückgeben
 */
function ud_notes_get_author() {
    $u = wp_get_current_user();
    return $u->nickname ?: $u->display_name ?: $u->user_login ?: 'Unbekannt';
}


/* =============================================================== *\
   A) Neue Notiz erstellen (/create)
\* =============================================================== */

function ud_notes_create($req) {
    global $wpdb;
    $table = $wpdb->prefix . 'ud_notes';

    $message = sanitize_text_field($req['message']);
    if (!$message) {
        return new WP_Error('no_message', 'Message required', ['status' => 400]);
    }

    $author = ud_notes_get_author();

    $wpdb->insert($table, [
        'parent_id' => 0,
        'message'   => $message,
        'author'    => $author,
        'created_at' => current_time('mysql'),
        'is_done'   => 0
    ]);

    $id   = $wpdb->insert_id;
    $note = ud_notes_get_note_by_id($id);

    // Ably jetzt clientseitig → hier nicht mehr publishen
    ud_notes_publish_ably('note-created', $note);

    return $note;
}


/* =============================================================== *\
   B) Antwort erstellen (/reply)
\* =============================================================== */

function ud_notes_reply($req) {
    global $wpdb;
    $table = $wpdb->prefix . 'ud_notes';

    $parent  = intval($req['parent']);
    $message = sanitize_text_field($req['message']);

    if (!$parent) {
        return new WP_Error('no_parent', 'Parent ID required', ['status' => 400]);
    }

    if (!$message) {
        return new WP_Error('no_message', 'Message required', ['status' => 400]);
    }

    $author = ud_notes_get_author();

    $wpdb->insert($table, [
        'parent_id' => $parent,
        'message'   => $message,
        'author'    => $author,
        'created_at' => current_time('mysql'),
        'is_done'   => 0
    ]);

    $id   = $wpdb->insert_id;
    $note = ud_notes_get_note_by_id($id);

    // Ably jetzt clientseitig
    ud_notes_publish_ably('note-replied', $note);

    return $note;
}


/* =============================================================== *\
   C) Notiz erledigen (/done)
\* =============================================================== */

function ud_notes_done($req) {
    global $wpdb;
    $table = $wpdb->prefix . 'ud_notes';

    $id = intval($req['id']);
    if (!$id) {
        return new WP_Error('no_id', 'ID required', ['status' => 400]);
    }

    $wpdb->update($table, ['is_done' => 1], ['id' => $id]);

    // Clientseitig publishen
    ud_notes_publish_ably('note-done', ['id' => $id]);

    return ['id' => $id];
}


/* =============================================================== *\
   D) Alle Notizen abrufen (/all)
\* =============================================================== */

function ud_notes_get_all() {
    error_log("🔥🔥🔥 UD Notes /all: user=" . get_current_user_id() . " logged_in=" . (is_user_logged_in() ? 'yes' : 'no'));

    global $wpdb;
    $table = $wpdb->prefix . 'ud_notes';

    $rows = $wpdb->get_results("SELECT * FROM $table WHERE is_done = 0 ORDER BY created_at ASC");

    $result = [];

    // zuerst Parent-Einträge
    foreach ($rows as $row) {
        if ($row->parent_id == 0) {
            $row->replies = [];
            $result[$row->id] = $row;
        }
    }

    // dann Replies zuordnen
    foreach ($rows as $row) {
        if ($row->parent_id != 0 && isset($result[$row->parent_id])) {
            $result[$row->parent_id]->replies[] = $row;
        }
    }

    return array_values($result);
}


/* =============================================================== *\
   E) Ably-Publish (leer, da clientseitig)
\* =============================================================== */

function ud_notes_publish_ably($event, $payload) {
    // leer → Publish erfolgt clientseitig via Ably JS SDK
}
