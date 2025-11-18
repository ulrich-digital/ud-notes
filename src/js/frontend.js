/**
 * UD Notes – frontend.js
 *
 * - Modal wie UD-Verpflegung
 * - Button in UD-Button-Bar
 * - REST mit Nonce
 * - Ably Live-Sync
 * - Autorenanzeige
 * - Replies
 * - Done
 */

import "../css/frontend.scss";

let channel = null;


/* =============================================================== *\
   Modal HTML ins DOM einfügen
\* =============================================================== */

const html = `
<div id="ud-notes-modal" class="ud-modal" hidden>
    <div class="ud-modal-backdrop"></div>

    <div class="ud-modal-content ud-notes-modal-content">

        <button class="ud-modal-close" type="button" id="ud-notes-close">
            <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M6.4 19L5 17.6L10.6 12L5 6.4L6.4 5L12 10.6L17.6 5L19 6.4L13.4 12L19 17.6L17.6 19L12 13.4L6.4 19Z" fill="#B2B2B2"/>
            </svg>
        </button>

        <h3 class="ud-modal-title">Nachrichten</h3>

        <div id="ud-notes-list" class="ud-notes-list"></div>

        <div class="ud-notes-input">
            <textarea id="ud-notes-new" class="ud-notes-new" placeholder="Neue Nachricht…"></textarea>
            <button id="ud-notes-add" class="button-save"><svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_118_789)">
<path d="M24.9059 2.35164e-05C24.7738 0.0163237 24.6464 0.0588205 24.5309 0.125024L0.530914 13.125C0.360778 13.219 0.222064 13.361 0.132065 13.5332C0.0420666 13.7055 0.00476537 13.9004 0.024812 14.0938C0.0448586 14.2871 0.121366 14.4702 0.244796 14.6204C0.368226 14.7705 0.533118 14.881 0.718914 14.938L7.09391 16.844C7.24291 18.023 7.90691 23.129 8.03091 24.125C8.15491 25.117 8.82891 25.289 9.49991 24.375C9.95391 23.756 12.6239 20 12.6249 20L18.3129 25.688C18.4354 25.8109 18.588 25.8994 18.7555 25.9447C18.923 25.9899 19.0994 25.9904 19.2671 25.9461C19.4348 25.9017 19.5879 25.8141 19.7111 25.6919C19.8343 25.5697 19.9232 25.4174 19.9689 25.25L25.9689 1.25002C26.0124 1.094 26.017 0.92968 25.9823 0.771473C25.9475 0.613266 25.8744 0.466007 25.7695 0.342611C25.6646 0.219215 25.531 0.123452 25.3804 0.0637222C25.2298 0.00399229 25.0669 -0.0178801 24.9059 2.35164e-05ZM23.4699 2.93802L18.4379 23.063L12.7819 17.406L20.9999 6.00002L8.21891 15.125L3.56291 13.75L23.4679 2.93702L23.4699 2.93802Z" fill="black"/>
</g>
<defs>
<clipPath id="clip0_118_789">
<rect width="26" height="26" fill="white"/>
</clipPath>
</defs>
</svg> Absenden</button>
        </div>
    </div>
</div>
`;
document.body.insertAdjacentHTML("beforeend", html);


/* =============================================================== *\
   Modal öffnen / schließen
\* =============================================================== */

function openNotesModal() {
	const modal = document.querySelector("#ud-notes-modal");
	modal.hidden = false;

	localStorage.setItem("ud_notes_unseen", "0");
	updateNotesButtonBadge();

	loadNotes();
}

function closeNotesModal() {
	document.querySelector("#ud-notes-modal").hidden = true;
}


/* =============================================================== *\
   DOMContentLoaded
\* =============================================================== */

document.addEventListener("DOMContentLoaded", async () => {

	// 1) Button in UD-Button-Bar einfügen
    
	const bar = document.querySelector("#ud-button-bar");
    let btn = null;

    if (bar) {
        btn = createNotesButton();
        bar.prepend(btn);
    }


    // Beobachte Bar → wenn neu gerendert → Button neu einsetzen

    if (bar) {
        const observer = new MutationObserver(() => {
            const exists = document.querySelector("#ud-notes-toggle");
            if (!exists) {
                // Bar wurde neu gerendert → Button wieder einfügen
                const newBtn = createNotesButton();
                bar.prepend(newBtn);
                updateNotesButtonBadge();
            }
        });

        observer.observe(bar, {
            childList: true,
            subtree: false
        });
    }


    // 2) Modal-Event-Listener

	const closeBtn = document.querySelector("#ud-notes-close");
	const backdrop = document.querySelector(
		"#ud-notes-modal .ud-modal-backdrop"
	);

	closeBtn?.addEventListener("click", closeNotesModal);
	backdrop?.addEventListener("click", closeNotesModal);

	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape") closeNotesModal();
	});


    // 3) Nachrichten-Button → Modal öffnen

	document.addEventListener("click", (e) => {
		if (e.target.closest("#ud-notes-toggle")) {
			openNotesModal();
		}
	});


    // 4) Ably Live Sync

	const ably = new Ably.Realtime({ key: UD_NOTES.ably_key });
	channel = ably.channels.get("notes");

	const markUnseen = () => {
	localStorage.setItem("ud_notes_unseen_count", "1");
	updateNotesButtonBadge();
	loadNotes();
	};

	channel.subscribe("note-created", markUnseen);
	channel.subscribe("note-replied", markUnseen);

	channel.subscribe("note-done", async ({ data }) => {
		await loadNotes();
		recalcUnseenStatusAfterDone(data.id);
	});

	updateNotesButtonBadge();


    // 5) Neue Nachricht senden

	document
		.querySelector("#ud-notes-add")
		.addEventListener("click", async () => {
			const textarea = document.querySelector("#ud-notes-new");
			const msg = textarea.value.trim();
			if (!msg) return;

			await fetch(UD_NOTES.rest.create, {
				method: "POST",
				credentials: "include",

				headers: {
					"Content-Type": "application/json",
					"X-WP-Nonce": UD_NOTES.nonce,
				},
				body: JSON.stringify({ message: msg }),
			});

			channel.publish("note-created", { message: msg });

			textarea.value = "";
			loadNotes();
		});


	// 6) Nachrichten ladnen

	loadNotes();
});



/* =============================================================== *\
   API: Nachrichten laden
\* =============================================================== */

async function loadNotes() {
	try {
		const res = await fetch(UD_NOTES.rest.all, {
			method: "GET",
			credentials: "include",
			headers: {
				"X-WP-Nonce": UD_NOTES.nonce,
			},
		});

		if (!res.ok) {
			console.error("❌ Fehler beim Laden der Nachrichten", res.status);
			return;
		}

		const notes = await res.json();
		window.__ud_last_notes = notes;

		const list = document.querySelector("#ud-notes-list");
		list.innerHTML = "";

		notes.forEach((note) => {
			const item = document.createElement("div");
			item.className = "ud-notes-item";

			/* Kopfzeile der Nachricht */
			let html = `
                <div class="ud-note">
                    <strong>${note.author || "Unbekannt"}:</strong> ${
						note.message
					}
                </div>
            `;

			/* Replies */
			if (note.replies?.length) {
				html += `
                    <div class="ud-note-replies">
                        ${note.replies
							.map(
								(r) => `
                                <div class="ud-note-reply">
                                    <strong>${
										r.author || "Unbekannt"
									}:</strong> ${r.message}
                                </div>
                            `
							)
							.join("")}
                    </div>
                `;
			}

			/* NEUE Struktur: Reply-Feld + Buttons gemeinsam */
			html += `
                <div class="ud-note-actions">
                    <textarea
                        class="ud-note-reply-field"
                        data-parent="${note.id}"
                        placeholder="Antwort…"></textarea>

                    <div class="ud-note-buttons">
                        <button class="ud-note-reply-btn" data-parent="${note.id}">Antwort senden</button>
                        <button class="ud-note-done" data-id="${note.id}"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9.5501 18L3.8501 12.3L5.2751 10.875L9.5501 15.15L18.7251 5.97498L20.1501 7.39998L9.5501 18Z" fill="black"/>
</svg>
 Erledigt</button>
                    </div>
                </div>
            `;

			item.innerHTML = html;


			// Event Listener: DONE

			item.querySelector(".ud-note-done").addEventListener(
				"click",
				async (e) => {
					const id = e.currentTarget.dataset.id;

					await fetch(UD_NOTES.rest.done, {
						method: "POST",
						credentials: "include",
						headers: {
							"Content-Type": "application/json",
							"X-WP-Nonce": UD_NOTES.nonce,
						},
						body: JSON.stringify({ id }),
					});

					channel.publish("note-done", { id });
					loadNotes();
				}
			);


            // Event Listener: REPLY

			item.querySelector(".ud-note-reply-btn").addEventListener(
				"click",
				async (e) => {
					//const parent = e.target.dataset.parent;
					const parent = e.currentTarget.dataset.parent;

					const field = item.querySelector(".ud-note-reply-field");
					const message = field.value.trim();
					if (!message) return;

					await fetch(UD_NOTES.rest.reply, {
						method: "POST",
						credentials: "include",
						headers: {
							"Content-Type": "application/json",
							"X-WP-Nonce": UD_NOTES.nonce,
						},
						body: JSON.stringify({ parent, message }),
					});

					channel.publish("note-replied", { parent, message });

					field.value = "";
					loadNotes();
				}
			);

			list.appendChild(item);
		});
	} catch (err) {
		console.error("❌ Fehler beim Laden der Nachrichten", err);
	}

}


/* =============================================================== *\
   Badge aktualisieren
\* =============================================================== */

function updateNotesButtonBadge() {
	const textEl = document.querySelector("#ud-notes-status-text");
	const circle = document.querySelector(".ud-notes-progress-ring .indicator");

	if (!textEl || !circle) return;

	const unseen = parseInt(localStorage.getItem("ud_notes_unseen_count") || "0", 10) > 0;

	if (!unseen) {
		circle.style.opacity = "0";
		textEl.textContent = "Keine neuen Nachrichten";
		return;
	}

	textEl.textContent = "Neue Nachrichten";
	circle.style.opacity = "1";
}

function recalcUnseenStatusAfterDone() {
	localStorage.setItem("ud_notes_last_seen", Date.now());
	localStorage.setItem("ud_notes_unseen_count", "0");
	updateNotesButtonBadge();
}


function createNotesButton() {
    const btn = document.createElement("button");
    btn.id = "ud-notes-toggle";
    btn.className = "ud-button-bar-button ud-notes-button";

    btn.innerHTML = `
        <div class="ud-notes-progress-ring progress-ring">
            <svg viewBox="0 0 36 36">
                <circle class="bg" cx="18" cy="18" r="16"></circle>
                <circle class="indicator" cx="18" cy="18" r="16"></circle>
            </svg>
        </div>

        <div class="ud-notes-button-content button-content">
            <div class="label">Nachrichten</div>
            <div class="status-text progress-text" id="ud-notes-status-text">Keine neuen Nachrichten</div>
        </div>
    `;

    return btn;
}
