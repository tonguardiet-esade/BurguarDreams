#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate _legal_translations.json from structured translation data."""

import json

BROWSER_HELP = {
    "es": [
        ("Chrome", "https://support.google.com/chrome/answer/95647?hl=es"),
        ("Safari", "https://support.apple.com/es-es/guide/safari/sfri11471/mac"),
        ("Explorer / Edge", "https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"),
        ("Firefox", "https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias"),
    ],
    "ca": [
        ("Chrome", "https://support.google.com/chrome/answer/95647?hl=ca"),
        ("Safari", "https://support.apple.com/ca-es/guide/safari/sfri11471/mac"),
        ("Explorer / Edge", "https://support.microsoft.com/ca-es/microsoft-edge/delete-cookies"),
        ("Firefox", "https://support.mozilla.org/ca/kb/enable-and-disable-cookies-website-preferences"),
    ],
    "en": [
        ("Chrome", "https://support.google.com/chrome/answer/95647?hl=en"),
        ("Safari", "https://support.apple.com/guide/safari/sfri11471/mac"),
        ("Explorer / Edge", "https://support.microsoft.com/en-us/microsoft-edge/delete-cookies"),
        ("Firefox", "https://support.mozilla.org/en-US/kb/enable-and-disable-cookies-website-preferences"),
    ],
    "fr": [
        ("Chrome", "https://support.google.com/chrome/answer/95647?hl=fr"),
        ("Safari", "https://support.apple.com/fr-fr/guide/safari/sfri11471/mac"),
        ("Explorer / Edge", "https://support.microsoft.com/fr-fr/microsoft-edge/supprimer-les-cookies"),
        ("Firefox", "https://support.mozilla.org/fr/kb/activer-desactiver-cookies"),
    ],
    "de": [
        ("Chrome", "https://support.google.com/chrome/answer/95647?hl=de"),
        ("Safari", "https://support.apple.com/de-de/guide/safari/sfri11471/mac"),
        ("Explorer / Edge", "https://support.microsoft.com/de-de/microsoft-edge/cookies-loeschen"),
        ("Firefox", "https://support.mozilla.org/de/kb/cookies-erlauben-und-ablehnen"),
    ],
    "it": [
        ("Chrome", "https://support.google.com/chrome/answer/95647?hl=it"),
        ("Safari", "https://support.apple.com/it-it/guide/safari/sfri11471/mac"),
        ("Explorer / Edge", "https://support.microsoft.com/it-it/microsoft-edge/eliminare-i-cookie"),
        ("Firefox", "https://support.mozilla.org/it/kb/Attivare%20e%20disattivare%20i%20cookie"),
    ],
}

GOOGLE_COOKIE_LINKS = {
    "es": [
        ("Tipos de cookies de Google", "https://www.google.es/intl/es/policies/technologies/types/"),
        ("Cookies publicitarias de Google", "https://www.google.es/policies/technologies/ads/"),
    ],
    "ca": [
        ("Tipus de galetes de Google", "https://www.google.es/intl/ca/policies/technologies/types/"),
        ("Galetes publicitàries de Google", "https://www.google.es/intl/ca/policies/technologies/ads/"),
    ],
    "en": [
        ("Types of Google cookies", "https://policies.google.com/technologies/types"),
        ("Google advertising cookies", "https://policies.google.com/technologies/ads"),
    ],
    "fr": [
        ("Types de cookies Google", "https://policies.google.com/technologies/types?hl=fr"),
        ("Cookies publicitaires Google", "https://policies.google.com/technologies/ads?hl=fr"),
    ],
    "de": [
        ("Arten von Google-Cookies", "https://policies.google.com/technologies/types?hl=de"),
        ("Google-Werbe-Cookies", "https://policies.google.com/technologies/ads?hl=de"),
    ],
    "it": [
        ("Tipi di cookie di Google", "https://policies.google.com/technologies/types?hl=it"),
        ("Cookie pubblicitari di Google", "https://policies.google.com/technologies/ads?hl=it"),
    ],
}

AEPD = {
    "es": "AEPD (Agencia Española de Protección de Datos)",
    "ca": "AEPD (Agència Espanyola de Protecció de Dades)",
    "en": "AEPD (Spanish Data Protection Agency)",
    "fr": "AEPD (Agence espagnole de protection des données)",
    "de": "AEPD (Spanische Datenschutzbehörde)",
    "it": "AEPD (Agenzia spagnola per la protezione dei dati)",
}


def link(text, url):
    return f'<a href="{url}" target="_blank" rel="noopener noreferrer">{text}</a>'


def mail_link():
    return '<a href="mailto:burguardreams@gmail.com">burguardreams@gmail.com</a>'


def aepd_link(lang):
    return link(AEPD[lang], "https://www.aepd.es")


def browser_list(lang):
    return [link(name, url) for name, url in BROWSER_HELP[lang]]


def google_ps2_item(lang):
    intros = {
        "es": "Todo lo relacionado con las cookies de Google, tanto analíticas como publicitarias, puede consultarse en:",
        "ca": "Tot el relacionat amb les galetes de Google, tant analítiques com publicitàries, es pot consultar a:",
        "en": "All information regarding Google cookies, both analytics and advertising, can be found at:",
        "fr": "Toutes les informations relatives aux cookies Google, analytiques et publicitaires, sont disponibles sur :",
        "de": "Alle Informationen zu Google-Cookies, sowohl analytische als auch Werbe-Cookies, finden Sie unter:",
        "it": "Tutte le informazioni relative ai cookie di Google, sia analitici che pubblicitari, sono disponibili su:",
    }
    items = "".join(
        f"<li>{link(name, url)}</li>" for name, url in GOOGLE_COOKIE_LINKS[lang]
    )
    return f'{intros[lang]}<ul>{items}</ul>'


def cookie_section4(lang):
    intros = {
        "es": "Puedes permitir, bloquear o eliminar las cookies instaladas en tu ordenador configurando las opciones de tu navegador. Encontrarás información sobre cómo hacerlo en los siguientes enlaces:",
        "ca": "Pots permetre, bloquejar o eliminar les galetes instal·lades al teu ordinador configurant les opcions del teu navegador. Trobaràs informació sobre com fer-ho als enllaços següents:",
        "en": "You can allow, block or delete cookies installed on your computer by configuring your browser options. You will find information on how to do this at the following links:",
        "fr": "Vous pouvez autoriser, bloquer ou supprimer les cookies installés sur votre ordinateur en configurant les options de votre navigateur. Vous trouverez des informations à ce sujet aux liens suivants :",
        "de": "Sie können installierte Cookies zulassen, blockieren oder löschen, indem Sie die Optionen Ihres Browsers konfigurieren. Informationen dazu finden Sie unter folgenden Links:",
        "it": "Puoi consentire, bloccare o eliminare i cookie installati sul tuo computer configurando le opzioni del browser. Troverai informazioni su come farlo ai seguenti link:",
    }
    disclaimers = {
        "es": "Sin embargo, le informamos de la posibilidad de que la desactivación de una cookie pueda impedir o dificultar la navegación o la prestación de los servicios ofrecidos en el sitio web.",
        "ca": "Tanmateix, l'informem de la possibilitat que la desactivació d'una galeta pugui impedir o dificultar la navegació o la prestació dels serveis oferts al lloc web.",
        "en": "However, please note that disabling a cookie may prevent or hinder browsing or the provision of services offered on the website.",
        "fr": "Toutefois, nous vous informons que la désactivation d'un cookie peut empêcher ou entraver la navigation ou la fourniture des services proposés sur le site web.",
        "de": "Bitte beachten Sie jedoch, dass die Deaktivierung eines Cookies die Navigation oder die Bereitstellung der auf der Website angebotenen Dienste verhindern oder erschweren kann.",
        "it": "Tuttavia, la informiamo che la disattivazione di un cookie può impedire o rendere difficile la navigazione o la prestazione dei servizi offerti sul sito web.",
    }
    titles = {
        "es": "4. Cómo bloquear o eliminar las cookies instaladas",
        "ca": "4. Com bloquejar o eliminar les galetes instal·lades",
        "en": "4. How to block or delete installed cookies",
        "fr": "4. Comment bloquer ou supprimer les cookies installés",
        "de": "4. Wie installierte Cookies blockiert oder gelöscht werden",
        "it": "4. Come bloccare o eliminare i cookie installati",
    }
    return {
        "h": titles[lang],
        "ps": [intros[lang]],
        "list": browser_list(lang),
        "ps2": [google_ps2_item(lang), disclaimers[lang]],
    }


LEGAL_TEXT = {
    "es": {
        "title": "AVISO LEGAL",
        "sections": [
            {"h": "Datos de identificación", "ps": [
                "Usted está visitando el sitio web de Burguar Dreams, propiedad de Burguar Dreams S.L., con domicilio social en C/ Can Bruixa, 16, ent. 1º, 08028 Barcelona, España, con NIF n.º B67209502, inscrita en el Registro Mercantil de Barcelona [DATOS REGISTRO MERCANTIL] (que en dicho documento se denomina «Burguar Dreams»).",
                "Esta actividad no está sujeta a ningún régimen de autorización administrativa previa.",
                "Puede ponerse en contacto con Burguar Dreams por cualquiera de los siguientes medios:",
            ], "list": ["Teléfono / WhatsApp: 660 68 85 01", "Correo electrónico: burguardreams@gmail.com"]},
            {"h": "Alojamiento web", "ps": ["Los datos de alojamiento web serán facilitados en cuanto estén disponibles."]},
            {"h": "Usuarios", "ps": [
                "Estas condiciones (en adelante, Aviso Legal) tienen por objeto regular el uso del sitio web de Burguar Dreams que pone a disposición del público.",
                "El acceso y/o uso de este sitio web le atribuye la condición de USUARIO, quien acepta, desde dicho acceso y/o uso, las condiciones generales de uso aquí reflejadas. Estas condiciones serán aplicables independientemente de las condiciones generales de contratación que pudieran ser obligatorias.",
            ]},
            {"h": "Uso del portal", "ps": [
                'Burguar Dreams proporciona acceso a información, servicios y datos (en adelante, "los contenidos") en Internet pertenecientes a Burguar Dreams S.L. o a sus licenciantes, a los que el USUARIO puede tener acceso.',
                "El USUARIO asume la responsabilidad del uso del sitio web. Esta responsabilidad se extiende al registro necesario para acceder a determinados servicios o contenidos. En dicho registro, el USUARIO deberá proporcionar información veraz y lícita. Como resultado de este registro, se le podrá asignar una contraseña, de la cual será responsable, comprometiéndose a hacer un uso diligente y confidencial de la misma.",
                "El USUARIO se compromete a hacer un uso adecuado de los contenidos y servicios que Burguar Dreams ofrece a través de su sitio web y, en particular, a no utilizarlos para:",
            ], "list": [
                "Participar en actividades ilícitas, ilegales o contrarias a la buena fe y al orden público.",
                "Difundir contenido o propaganda de carácter racista, xenófobo, pornográfico ilegal, que promueva el terrorismo o viole los derechos humanos.",
                "Causar daños a los sistemas físicos y lógicos de Burguar Dreams, sus proveedores o terceros, o introducir virus informáticos o cualquier otro elemento dañino.",
                "Intentar acceder a cuentas de otros usuarios o manipular sus mensajes.",
                "Utilizar el sitio web con fines comerciales, políticos o publicitarios no autorizados, incluido el envío de correos electrónicos no solicitados.",
            ], "ps2": [
                "Burguar Dreams se reserva el derecho de retirar todos los comentarios y contribuciones que atenten contra la dignidad de la persona, que sean discriminatorios, xenófobos, racistas, pornográficos, que amenacen el orden o la seguridad pública, o que no sean adecuados para su publicación. En ningún caso, Burguar Dreams se responsabilizará de las opiniones expresadas por los usuarios a través de foros, chats u otras herramientas de participación.",
            ]},
            {"h": "Protección de datos", "ps": ["Todo lo relacionado con la política de protección de datos está contenido en el documento de Política de Privacidad, disponible en el sitio web."]},
            {"h": "Propiedad intelectual e industrial", "ps": [
                "Burguar Dreams S.L. es titular de todos los derechos de propiedad intelectual e industrial de su sitio web, así como de los elementos contenidos en el mismo (a título enunciativo: imágenes, fotografías, textos, marcas, logotipos, combinaciones de colores, estructura y diseño, software, etc.), propiedad de Burguar Dreams S.L. o de sus licenciantes.",
                "Todos los derechos reservados. De conformidad con lo dispuesto en la Ley de Propiedad Intelectual, queda expresamente prohibida la reproducción, distribución y comunicación pública de la totalidad o parte de los contenidos de este sitio web con fines comerciales, en cualquier soporte y por cualquier medio técnico, sin la autorización expresa de Burguar Dreams S.L.",
                "El USUARIO se compromete a respetar los derechos de propiedad intelectual e industrial de Burguar Dreams. Podrá visualizar los elementos del sitio web e imprimirlos, copiarlos o almacenarlos única y exclusivamente para uso personal y privado.",
            ]},
            {"h": "Exclusión de garantías y responsabilidad", "ps": [
                "El USUARIO reconoce que el uso del sitio web, sus contenidos y servicios se realiza bajo su exclusiva responsabilidad. En particular, Burguar Dreams no asume responsabilidad en los siguientes ámbitos:",
            ], "list": [
                "La disponibilidad, calidad o interoperabilidad del sitio web, sus servicios y contenidos.",
                "La infracción de la legislación vigente por parte del USUARIO o de terceros, especialmente en materia de propiedad intelectual o industrial.",
                "La existencia de códigos maliciosos o elementos dañinos que pudieran afectar al sistema informático del USUARIO.",
                "El acceso fraudulento a contenidos o servicios por parte de terceros no autorizados.",
                "La exactitud, veracidad o utilidad de los contenidos ofrecidos. Burguar Dreams empleará todos los medios razonables para proporcionar información actualizada y fiable.",
                "Daños causados a los equipos informáticos del USUARIO o derivados de fallos en las redes de telecomunicaciones.",
                "Daños derivados de caso fortuito o fuerza mayor.",
            ]},
            {"h": "Modificación de este aviso legal", "ps": [
                "Burguar Dreams se reserva el derecho de realizar, sin previo aviso, las modificaciones que considere oportunas en el sitio web, pudiendo cambiar, eliminar o añadir tanto los contenidos y servicios como la forma en que se presentan.",
                "La validez de las condiciones aquí reflejadas dependerá de su publicación y estarán vigentes hasta que sean modificadas por otras debidamente publicadas.",
            ]},
            {"h": "Política de enlaces", "ps": ["En caso de que el sitio web incluya enlaces o hipervínculos a otros sitios web, Burguar Dreams no ejercerá ningún tipo de control sobre dichos sitios ni sus contenidos. En ningún caso Burguar Dreams asumirá responsabilidad alguna por el contenido de los enlaces a sitios web de terceros, ni garantizará su disponibilidad, calidad, fiabilidad o exactitud. La inclusión de estas conexiones externas no implicará ningún tipo de asociación, fusión ni participación con las entidades enlazadas."]},
            {"h": "Derecho de exclusión", "ps": ["Burguar Dreams se reserva el derecho de denegar o retirar el acceso al sitio web y/o a los servicios ofrecidos sin previo aviso, a petición propia o de un tercero, a aquellos usuarios que no cumplan con el contenido de este Aviso Legal."]},
            {"h": "Generalidades", "ps": ["Burguar Dreams perseguirá el incumplimiento de estas condiciones, así como cualquier uso indebido del sitio web, ejerciendo todas las acciones civiles y penales que le correspondan por ley."]},
            {"h": "Ley aplicable y jurisdicción", "ps": ["La relación entre Burguar Dreams y el USUARIO se regirá por la normativa española vigente. Todas las controversias y reclamaciones derivadas de este Aviso Legal serán resueltas por los juzgados y tribunales de la ciudad de Barcelona."]},
        ],
    },
}

# Import remaining translations from companion modules
from _legal_translations_data import LEGAL_TRANSLATIONS
from _legal_translations_privacy import PRIVACY_TEXT
from _legal_translations_cookies import COOKIES_SECTIONS

LEGAL_TEXT.update(LEGAL_TRANSLATIONS)

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "_legal_translations.json"

data = {
    "LEGAL_TEXT": LEGAL_TEXT,
    "PRIVACY_TEXT": PRIVACY_TEXT,
    "COOKIES_SECTIONS": COOKIES_SECTIONS,
}

# Inject cookie section 4 for all languages
for lang in ("es", "ca", "en", "fr", "de", "it"):
    COOKIES_SECTIONS[lang]["sections"][3] = cookie_section4(lang)

OUTPUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

size = OUTPUT.stat().st_size
print(f"Written {OUTPUT.relative_to(ROOT)}")
print(f"File size: {size} bytes ({size/1024:.1f} KB)")
