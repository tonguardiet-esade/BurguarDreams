# -*- coding: utf-8 -*-
"""Privacy and cookies translation data."""

def _aepd(lang):
    texts = {
        "es": "AEPD (Agencia Española de Protección de Datos)",
        "ca": "AEPD (Agència Espanyola de Protecció de Dades)",
        "en": "AEPD (Spanish Data Protection Agency)",
        "fr": "AEPD (Agence espagnole de protection des données)",
        "de": "AEPD (Spanische Datenschutzbehörde)",
        "it": "AEPD (Agenzia spagnola per la protezione dei dati)",
    }
    return f'<a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">{texts[lang]}</a>'


def _mail():
    return '<a href="mailto:burguardreams@gmail.com">burguardreams@gmail.com</a>'


PRIVACY_TEXT = {
    "es": {
        "title": "POLÍTICA DE PRIVACIDAD",
        "sections": [
            {"ps": [
                "Burguar Dreams S.L., con el fin de proteger los derechos individuales y ser transparente con el Usuario, ha establecido una política que incluye todos los tratamientos de datos, las finalidades perseguidas, la legitimidad de los mismos y los instrumentos disponibles para que el Usuario pueda ejercer sus derechos.",
                f"La navegación por este sitio web implica la aceptación total de las siguientes disposiciones. Se acepta el uso de cookies. Si no está de acuerdo, envíe un correo electrónico a {_mail()}.",
                "La versión actualizada de esta política de privacidad es la única aplicable durante el tiempo que se utilice el sitio web, hasta que no exista otra versión que la reemplace.",
                f"Para obtener información adicional sobre la protección de datos personales, le invitamos a consultar la página web de la {_aepd('es')}.",
            ]},
            {"h": "Recopilación de datos", "ps": [
                "Sus datos son recopilados por Burguar Dreams S.L.",
                "Los datos personales son toda información relativa a una persona física identificada o identificable. Se entiende por persona identificable aquella que puede ser identificada, directa o indirectamente, especialmente mediante un nombre, un número de identificación (DNI, NIF, NIE, pasaporte) o uno o varios elementos específicos de su identidad física, fisiológica, genética, psíquica, económica, cultural o social.",
                "Los datos que generalmente se recopilarán son: nombre y apellidos, dirección, correo electrónico, número de teléfono, fecha de nacimiento y situación laboral e ingresos, en el contexto de solicitudes de información sobre alquiler de apartamentos. Se podrán recopilar otros tipos de datos, informando al usuario en cada caso.",
            ]},
            {"h": "¿Con qué finalidad se tratan sus datos personales?", "ps": [
                "La finalidad del tratamiento de los datos personales que se puedan recabar es su uso principal por parte de Burguar Dreams S.L. para la gestión de su relación con usted, para poder ofrecerle apartamentos y servicios acordes a sus necesidades, para mejorar su experiencia como usuario y para tramitar sus solicitudes de información o reserva. No se tomarán decisiones automatizadas basadas en su perfil.",
                "Los datos facilitados se conservarán mientras se mantenga la relación comercial, siempre que el interesado no solicite su supresión, o durante los años necesarios para cumplir con las obligaciones legales.",
            ]},
            {"h": "¿Cuál es la legitimidad del tratamiento de sus datos?", "ps": ["La base legal para el tratamiento de sus datos personales es:"], "list": [
                "El interés legítimo de Burguar Dreams S.L.",
                "El consentimiento del usuario o cliente para el tratamiento de sus datos.",
            ]},
            {"h": "¿A qué destinatarios se comunicarán los datos?", "ps": [
                "Los datos personales del Usuario podrán ser comunicados eventualmente a terceros relacionados con Burguar Dreams S.L. por contrato para la realización de tareas necesarias para la gestión de su solicitud, sin necesidad de autorización expresa.",
                "También cuando fuera necesario comunicarse con las autoridades en caso de que el Usuario hubiera realizado acciones contrarias a la Ley o infringido el contenido del Aviso Legal.",
                "Los datos personales del Usuario no serán transferidos a terceros países ni a organizaciones internacionales, salvo que el Usuario sea debidamente informado de dicha transferencia, sus condiciones y destinatario.",
                "Cuando determinados datos sean obligatorios para acceder a funcionalidades específicas del sitio web, Burguar Dreams S.L. indicará este carácter obligatorio en el momento de la recogida.",
            ]},
            {"h": "Cookies", "ps": [
                "Al navegar por este sitio web, las cookies de Burguar Dreams S.L. y/o de terceros pueden instalarse en su dispositivo. Durante la primera navegación, aparecerá un banner informativo sobre el uso de cookies.",
                "Al continuar la navegación, el Usuario se considerará informado y habrá aceptado el uso de dichas cookies. El consentimiento otorgado tendrá una validez de trece meses.",
                "Para obtener más información, consulte nuestra Política de Cookies.",
            ]},
            {"h": "Derechos del usuario", "ps": [
                "Se informa al usuario de la posibilidad de ejercer sus derechos de acceso, rectificación, cancelación y oposición. Asimismo, toda persona tiene derecho a la limitación del tratamiento de sus datos personales, a la supresión de los datos transmitidos al responsable del tratamiento y a la portabilidad de sus datos.",
                f"El usuario tiene la posibilidad de presentar una reclamación ante la {_aepd('es')} cuando no haya obtenido una solución satisfactoria en el ejercicio de sus derechos.",
                f"Salvo que el Usuario se oponga, mediante el envío de un correo electrónico a {_mail()}, sus datos podrán ser utilizados para enviarle información sobre apartamentos y servicios de Burguar Dreams S.L.",
                "Los datos facilitados se conservarán mientras se mantenga la relación comercial o durante los años necesarios para cumplir con las obligaciones legales.",
                "El Usuario es responsable de que la información proporcionada a través de este sitio web sea veraz, respondiendo de la exactitud de todos los datos comunicados y manteniéndolos actualizados para reflejar su situación real.",
                "Esta información será almacenada y gestionada con la debida confidencialidad, aplicando las medidas de seguridad informática necesarias para evitar el acceso o uso indebido de sus datos, su manipulación, deterioro o pérdida.",
                "Sin embargo, el Usuario debe tener en cuenta que la seguridad de los sistemas informáticos nunca es absoluta. Al proporcionar datos personales en línea, dicha información puede ser recopilada sin su consentimiento y procesada por terceros no autorizados. Burguar Dreams S.L. declina cualquier responsabilidad por las consecuencias de dichos actos si el Usuario publicó la información voluntariamente.",
                "Podrá ejercer estos derechos mediante solicitud escrita dirigida a:",
                "<strong>Burguar Dreams S.L.</strong><br>C/ Can Bruixa, 16, ent. 1º<br>08028 Barcelona",
                f"O por correo electrónico a: {_mail()}, adjuntando copia del DNI o documento equivalente.",
                "Estas solicitudes serán atendidas en el plazo de un mes, prorrogable a dos meses si la complejidad o el número de solicitudes así lo requiere, sin perjuicio de la obligación de conservar determinados datos en los plazos legales.",
                "Asimismo, los usuarios que lo soliciten tienen la posibilidad de organizar el destino de sus datos tras su fallecimiento.",
            ]},
        ],
    },
    "ca": {
        "title": "POLÍTICA DE PRIVACITAT",
        "sections": [
            {"ps": [
                "Burguar Dreams S.L., amb la finalitat de protegir els drets individuals i ser transparent amb l'Usuari, ha establert una política que inclou tots els tractaments de dades, les finalitats perseguides, la legitimació d'aquests i els instruments disponibles perquè l'Usuari pugui exercir els seus drets.",
                f"La navegació per aquest lloc web implica l'acceptació total de les disposicions següents. S'accepta l'ús de galetes. Si no hi esteu d'acord, envieu un correu electrònic a {_mail()}.",
                "La versió actualitzada d'aquesta política de privacitat és l'única aplicable durant el temps que s'utilitzi el lloc web, fins que no n'existeixi una altra versió que la substitueixi.",
                f"Per obtenir informació addicional sobre la protecció de dades personals, us convidem a consultar la pàgina web de l'{_aepd('ca')}.",
            ]},
            {"h": "Recollida de dades", "ps": [
                "Les vostres dades són recollides per Burguar Dreams S.L.",
                "Les dades personals són tota informació relativa a una persona física identificada o identificable. S'entén per persona identificable aquella que pot ser identificada, directa o indirectament, especialment mitjançant un nom, un número d'identificació (DNI, NIF, NIE, passaport) o un o diversos elements específics de la seva identitat física, fisiològica, genètica, psíquica, econòmica, cultural o social.",
                "Les dades que generalment es recolliran són: nom i cognoms, adreça, correu electrònic, número de telèfon, data de naixement i situació laboral i ingressos, en el context de sol·licituds d'informació sobre lloguer d'apartaments. Es podran recollir altres tipus de dades, informant l'usuari en cada cas.",
            ]},
            {"h": "Amb quina finalitat es tracten les vostres dades personals?", "ps": [
                "La finalitat del tractament de les dades personals que es puguin recaptar és el seu ús principal per part de Burguar Dreams S.L. per a la gestió de la vostra relació amb vosaltres, per poder oferir-vos apartaments i serveis acords a les vostres necessitats, per millorar la vostra experiència com a usuari i per tramitar les vostres sol·licituds d'informació o reserva. No es prendran decisions automatitzades basades en el vostre perfil.",
                "Les dades facilitades es conservaran mentre es mantingui la relació comercial, sempre que l'interessat no sol·liciti la seva supressió, o durant els anys necessaris per complir amb les obligacions legals.",
            ]},
            {"h": "Quina és la legitimació del tractament de les vostres dades?", "ps": ["La base legal per al tractament de les vostres dades personals és:"], "list": [
                "L'interès legítim de Burguar Dreams S.L.",
                "El consentiment de l'usuari o client per al tractament de les seves dades.",
            ]},
            {"h": "A quins destinataris es comunicaran les dades?", "ps": [
                "Les dades personals de l'Usuari podran ser comunicades eventualment a tercers relacionats amb Burguar Dreams S.L. per contracte per a la realització de tasques necessàries per a la gestió de la seva sol·licitud, sense necessitat d'autorització expressa.",
                "També quan calgués comunicar-se amb les autoritats en cas que l'Usuari hagués realitzat accions contràries a la Llei o infringit el contingut de l'Avís Legal.",
                "Les dades personals de l'Usuari no seran transferides a tercers països ni a organitzacions internacionals, llevat que l'Usuari sigui degudament informat d'aquesta transferència, les seves condicions i destinatari.",
                "Quan determinades dades siguin obligatòries per accedir a funcionalitats específiques del lloc web, Burguar Dreams S.L. indicarà aquest caràcter obligatori en el moment de la recollida.",
            ]},
            {"h": "Galetes", "ps": [
                "En navegar per aquest lloc web, les galetes de Burguar Dreams S.L. i/o de tercers poden instal·lar-se al vostre dispositiu. Durant la primera navegació, apareixerà un banner informatiu sobre l'ús de galetes.",
                "En continuar la navegació, l'Usuari es considerarà informat i haurà acceptat l'ús d'aquestes galetes. El consentiment atorgat tindrà una validesa de tretze mesos.",
                "Per obtenir més informació, consulteu la nostra Política de Galetes.",
            ]},
            {"h": "Drets de l'usuari", "ps": [
                "S'informa l'usuari de la possibilitat d'exercir els seus drets d'accés, rectificació, cancel·lació i oposició. Així mateix, tota persona té dret a la limitació del tractament de les seves dades personals, a la supressió de les dades transmeses al responsable del tractament i a la portabilitat de les seves dades.",
                f"L'usuari té la possibilitat de presentar una reclamació davant l'{_aepd('ca')} quan no hagi obtingut una solució satisfactòria en l'exercici dels seus drets.",
                f"Llevat que l'Usuari s'oposi, mitjançant l'enviament d'un correu electrònic a {_mail()}, les seves dades podran ser utilitzades per enviar-li informació sobre apartaments i serveis de Burguar Dreams S.L.",
                "Les dades facilitades es conservaran mentre es mantingui la relació comercial o durant els anys necessaris per complir amb les obligacions legals.",
                "L'Usuari és responsable que la informació proporcionada a través d'aquest lloc web sigui verídica, responent de l'exactitud de totes les dades comunicades i mantenint-les actualitzades per reflectir la seva situació real.",
                "Aquesta informació serà emmagatzemada i gestionada amb la deguda confidencialitat, aplicant les mesures de seguretat informàtica necessàries per evitar l'accés o ús indegut de les seves dades, la seva manipulació, deteriorament o pèrdua.",
                "Tanmateix, l'Usuari ha de tenir en compte que la seguretat dels sistemes informàtics mai és absoluta. En proporcionar dades personals en línia, aquesta informació pot ser recollida sense el seu consentiment i processada per tercers no autoritzats. Burguar Dreams S.L. declina qualsevol responsabilitat per les conseqüències d'aquests actes si l'Usuari va publicar la informació voluntàriament.",
                "Podrà exercir aquests drets mitjançant sol·licitud escrita dirigida a:",
                "<strong>Burguar Dreams S.L.</strong><br>C/ Can Bruixa, 16, ent. 1º<br>08028 Barcelona",
                f"O per correu electrònic a: {_mail()}, adjuntant còpia del DNI o document equivalent.",
                "Aquestes sol·licituds seran ateses en el termini d'un mes, prorrogable a dos mesos si la complexitat o el nombre de sol·licituds ho requereixen, sense perjudici de l'obligació de conservar determinades dades en els terminis legals.",
                "Així mateix, els usuaris que ho sol·licitin tenen la possibilitat d'organitzar el destí de les seves dades després del seu defunció.",
            ]},
        ],
    },
    "en": {
        "title": "PRIVACY POLICY",
        "sections": [
            {"ps": [
                "Burguar Dreams S.L., in order to protect individual rights and be transparent with the User, has established a policy that includes all data processing activities, the purposes pursued, their legal basis and the instruments available for the User to exercise their rights.",
                f"Browsing this website implies full acceptance of the following provisions. The use of cookies is accepted. If you do not agree, please send an email to {_mail()}.",
                "The updated version of this privacy policy is the only one applicable for as long as the website is used, until another version replaces it.",
                f"For additional information on personal data protection, we invite you to visit the website of the {_aepd('en')}.",
            ]},
            {"h": "Data collection", "ps": [
                "Your data is collected by Burguar Dreams S.L.",
                "Personal data is any information relating to an identified or identifiable natural person. An identifiable person is one who can be identified, directly or indirectly, in particular by reference to a name, an identification number (ID card, tax ID, foreigner ID, passport) or one or more specific elements of their physical, physiological, genetic, mental, economic, cultural or social identity.",
                "The data generally collected includes: name and surname, address, email, telephone number, date of birth and employment status and income, in the context of requests for information about apartment rentals. Other types of data may be collected, informing the user in each case.",
            ]},
            {"h": "For what purpose are your personal data processed?", "ps": [
                "The purpose of processing personal data that may be collected is primarily for Burguar Dreams S.L. to manage its relationship with you, to offer apartments and services suited to your needs, to improve your user experience and to process your information or booking requests. No automated decisions will be made based on your profile.",
                "The data provided will be retained for as long as the commercial relationship is maintained, provided the data subject does not request its deletion, or for the years necessary to comply with legal obligations.",
            ]},
            {"h": "What is the legal basis for processing your data?", "ps": ["The legal basis for processing your personal data is:"], "list": [
                "The legitimate interest of Burguar Dreams S.L.",
                "The consent of the user or client for the processing of their data.",
            ]},
            {"h": "To whom will the data be disclosed?", "ps": [
                "The User's personal data may eventually be disclosed to third parties related to Burguar Dreams S.L. by contract for the performance of tasks necessary for the management of their request, without the need for express authorisation.",
                "Also when it is necessary to communicate with the authorities in the event that the User has carried out actions contrary to the Law or infringed the content of the Legal Notice.",
                "The User's personal data will not be transferred to third countries or international organisations, unless the User is duly informed of such transfer, its conditions and recipient.",
                "When certain data is mandatory to access specific functionalities of the website, Burguar Dreams S.L. will indicate this mandatory nature at the time of collection.",
            ]},
            {"h": "Cookies", "ps": [
                "When browsing this website, cookies from Burguar Dreams S.L. and/or third parties may be installed on your device. During the first visit, an informative banner about the use of cookies will appear.",
                "By continuing to browse, the User shall be deemed informed and to have accepted the use of such cookies. The consent given shall be valid for thirteen months.",
                "For more information, please see our Cookie Policy.",
            ]},
            {"h": "User rights", "ps": [
                "The user is informed of the possibility of exercising their rights of access, rectification, erasure and objection. Likewise, every person has the right to restriction of processing of their personal data, to erasure of data transmitted to the data controller and to data portability.",
                f"The user has the possibility of filing a complaint with the {_aepd('en')} when they have not obtained a satisfactory solution in the exercise of their rights.",
                f"Unless the User objects, by sending an email to {_mail()}, their data may be used to send them information about apartments and services of Burguar Dreams S.L.",
                "The data provided will be retained for as long as the commercial relationship is maintained or for the years necessary to comply with legal obligations.",
                "The User is responsible for ensuring that the information provided through this website is truthful, answering for the accuracy of all data communicated and keeping it updated to reflect their actual situation.",
                "This information will be stored and managed with due confidentiality, applying the necessary IT security measures to prevent unauthorised access or use of their data, its manipulation, deterioration or loss.",
                "However, the User should bear in mind that the security of computer systems is never absolute. When providing personal data online, such information may be collected without their consent and processed by unauthorised third parties. Burguar Dreams S.L. disclaims any liability for the consequences of such acts if the User published the information voluntarily.",
                "You may exercise these rights by written request addressed to:",
                "<strong>Burguar Dreams S.L.</strong><br>C/ Can Bruixa, 16, ent. 1º<br>08028 Barcelona",
                f"Or by email to: {_mail()}, attaching a copy of your ID card or equivalent document.",
                "These requests will be answered within one month, extendable to two months if the complexity or number of requests so requires, without prejudice to the obligation to retain certain data for the legal periods.",
                "Likewise, users who so request have the possibility of organising the destination of their data after their death.",
            ]},
        ],
    },
    "fr": {
        "title": "POLITIQUE DE CONFIDENTIALITÉ",
        "sections": [
            {"ps": [
                "Burguar Dreams S.L., afin de protéger les droits individuels et d'être transparente avec l'Utilisateur, a établi une politique qui inclut tous les traitements de données, les finalités poursuivies, leur légitimité et les instruments disponibles pour que l'Utilisateur puisse exercer ses droits.",
                f"La navigation sur ce site web implique l'acceptation totale des dispositions suivantes. L'utilisation de cookies est acceptée. Si vous n'êtes pas d'accord, veuillez envoyer un courriel à {_mail()}.",
                "La version actualisée de cette politique de confidentialité est la seule applicable pendant toute la durée d'utilisation du site web, jusqu'à ce qu'une autre version la remplace.",
                f"Pour obtenir des informations complémentaires sur la protection des données personnelles, nous vous invitons à consulter le site web de l'{_aepd('fr')}.",
            ]},
            {"h": "Collecte de données", "ps": [
                "Vos données sont collectées par Burguar Dreams S.L.",
                "Les données personnelles sont toute information relative à une personne physique identifiée ou identifiable. On entend par personne identifiable celle qui peut être identifiée, directement ou indirectement, notamment par un nom, un numéro d'identification (DNI, NIF, NIE, passeport) ou un ou plusieurs éléments spécifiques de son identité physique, physiologique, génétique, psychique, économique, culturelle ou sociale.",
                "Les données généralement collectées sont : nom et prénom, adresse, courriel, numéro de téléphone, date de naissance et situation professionnelle et revenus, dans le cadre de demandes d'information sur la location d'appartements. D'autres types de données pourront être collectés, l'utilisateur étant informé dans chaque cas.",
            ]},
            {"h": "À quelle fin vos données personnelles sont-elles traitées ?", "ps": [
                "La finalité du traitement des données personnelles pouvant être collectées est leur utilisation principale par Burguar Dreams S.L. pour la gestion de votre relation avec vous, afin de vous proposer des appartements et des services adaptés à vos besoins, pour améliorer votre expérience en tant qu'utilisateur et pour traiter vos demandes d'information ou de réservation. Aucune décision automatisée ne sera prise sur la base de votre profil.",
                "Les données fournies seront conservées tant que la relation commerciale est maintenue, pourvu que l'intéressé ne demande pas leur suppression, ou pendant les années nécessaires pour respecter les obligations légales.",
            ]},
            {"h": "Quelle est la base légale du traitement de vos données ?", "ps": ["La base légale du traitement de vos données personnelles est :"], "list": [
                "L'intérêt légitime de Burguar Dreams S.L.",
                "Le consentement de l'utilisateur ou du client pour le traitement de ses données.",
            ]},
            {"h": "À quels destinataires les données seront-elles communiquées ?", "ps": [
                "Les données personnelles de l'Utilisateur pourront éventuellement être communiquées à des tiers liés à Burguar Dreams S.L. par contrat pour la réalisation de tâches nécessaires à la gestion de sa demande, sans nécessité d'autorisation expresse.",
                "Également lorsqu'il serait nécessaire de communiquer avec les autorités dans le cas où l'Utilisateur aurait réalisé des actions contraires à la Loi ou enfreint le contenu des Mentions Légales.",
                "Les données personnelles de l'Utilisateur ne seront pas transférées vers des pays tiers ni vers des organisations internationales, sauf si l'Utilisateur est dûment informé de ce transfert, de ses conditions et de son destinataire.",
                "Lorsque certaines données sont obligatoires pour accéder à des fonctionnalités spécifiques du site web, Burguar Dreams S.L. indiquera ce caractère obligatoire au moment de la collecte.",
            ]},
            {"h": "Cookies", "ps": [
                "En naviguant sur ce site web, des cookies de Burguar Dreams S.L. et/ou de tiers peuvent être installés sur votre appareil. Lors de la première navigation, une bannière informative sur l'utilisation des cookies apparaîtra.",
                "En poursuivant la navigation, l'Utilisateur sera considéré comme informé et comme ayant accepté l'utilisation de ces cookies. Le consentement accordé aura une validité de treize mois.",
                "Pour plus d'informations, consultez notre Politique de Cookies.",
            ]},
            {"h": "Droits de l'utilisateur", "ps": [
                "L'utilisateur est informé de la possibilité d'exercer ses droits d'accès, de rectification, d'effacement et d'opposition. De même, toute personne a le droit à la limitation du traitement de ses données personnelles, à l'effacement des données transmises au responsable du traitement et à la portabilité de ses données.",
                f"L'utilisateur a la possibilité de déposer une réclamation auprès de l'{_aepd('fr')} lorsqu'il n'a pas obtenu de solution satisfaisante dans l'exercice de ses droits.",
                f"Sauf opposition de l'Utilisateur, par l'envoi d'un courriel à {_mail()}, ses données pourront être utilisées pour lui envoyer des informations sur les appartements et services de Burguar Dreams S.L.",
                "Les données fournies seront conservées tant que la relation commerciale est maintenue ou pendant les années nécessaires pour respecter les obligations légales.",
                "L'Utilisateur est responsable du fait que les informations fournies via ce site web soient véridiques, répondant de l'exactitude de toutes les données communiquées et les maintenant à jour pour refléter sa situation réelle.",
                "Ces informations seront stockées et gérées avec la due confidentialité, en appliquant les mesures de sécurité informatique nécessaires pour éviter l'accès ou l'utilisation abusive de ses données, leur manipulation, détérioration ou perte.",
                "Toutefois, l'Utilisateur doit tenir compte du fait que la sécurité des systèmes informatiques n'est jamais absolue. En fournissant des données personnelles en ligne, ces informations peuvent être collectées sans son consentement et traitées par des tiers non autorisés. Burguar Dreams S.L. décline toute responsabilité pour les conséquences de tels actes si l'Utilisateur a publié les informations volontairement.",
                "Vous pourrez exercer ces droits par demande écrite adressée à :",
                "<strong>Burguar Dreams S.L.</strong><br>C/ Can Bruixa, 16, ent. 1º<br>08028 Barcelona",
                f"Ou par courriel à : {_mail()}, en joignant une copie de la carte d'identité ou document équivalent.",
                "Ces demandes seront traitées dans un délai d'un mois, prorogeable à deux mois si la complexité ou le nombre de demandes l'exige, sans préjudice de l'obligation de conserver certaines données pendant les délais légaux.",
                "De même, les utilisateurs qui le demandent ont la possibilité d'organiser le sort de leurs données après leur décès.",
            ]},
        ],
    },
    "de": {
        "title": "DATENSCHUTZERKLÄRUNG",
        "sections": [
            {"ps": [
                "Burguar Dreams S.L. hat zum Schutz der individuellen Rechte und zur Transparenz gegenüber dem Nutzer eine Richtlinie erstellt, die alle Datenverarbeitungen, die verfolgten Zwecke, deren Rechtsgrundlage und die dem Nutzer zur Verfügung stehenden Instrumente zur Ausübung seiner Rechte umfasst.",
                f"Das Surfen auf dieser Website impliziert die vollständige Annahme der folgenden Bestimmungen. Die Verwendung von Cookies wird akzeptiert. Wenn Sie nicht einverstanden sind, senden Sie bitte eine E-Mail an {_mail()}.",
                "Die aktualisierte Version dieser Datenschutzerklärung ist die einzige anwendbare Version für die Dauer der Nutzung der Website, bis eine andere Version sie ersetzt.",
                f"Für weitere Informationen zum Schutz personenbezogener Daten laden wir Sie ein, die Website der {_aepd('de')} zu besuchen.",
            ]},
            {"h": "Datenerhebung", "ps": [
                "Ihre Daten werden von Burguar Dreams S.L. erhoben.",
                "Personenbezogene Daten sind alle Informationen, die sich auf eine identifizierte oder identifizierbare natürliche Person beziehen. Als identifizierbar gilt eine Person, die direkt oder indirekt identifiziert werden kann, insbesondere mittels eines Namens, einer Identifikationsnummer (Personalausweis, Steuernummer, Ausländerausweis, Reisepass) oder eines oder mehrerer spezifischer Merkmale ihrer physischen, physiologischen, genetischen, psychischen, wirtschaftlichen, kulturellen oder sozialen Identität.",
                "Die in der Regel erhobenen Daten sind: Name und Nachname, Adresse, E-Mail, Telefonnummer, Geburtsdatum sowie Beschäftigungsstatus und Einkommen im Rahmen von Anfragen zu Apartmentvermietungen. Es können weitere Datentypen erhoben werden, wobei der Nutzer in jedem Fall informiert wird.",
            ]},
            {"h": "Zu welchem Zweck werden Ihre personenbezogenen Daten verarbeitet?", "ps": [
                "Der Zweck der Verarbeitung der erhobenen personenbezogenen Daten ist deren vorrangige Nutzung durch Burguar Dreams S.L. zur Verwaltung Ihrer Beziehung zu Ihnen, um Ihnen Apartments und Dienstleistungen entsprechend Ihrer Bedürfnisse anzubieten, Ihre Nutzererfahrung zu verbessern und Ihre Informations- oder Buchungsanfragen zu bearbeiten. Es werden keine automatisierten Entscheidungen auf Grundlage Ihres Profils getroffen.",
                "Die bereitgestellten Daten werden aufbewahrt, solange die Geschäftsbeziehung besteht, sofern die betroffene Person nicht deren Löschung verlangt, oder für die zur Erfüllung gesetzlicher Verpflichtungen erforderlichen Jahre.",
            ]},
            {"h": "Was ist die Rechtsgrundlage für die Verarbeitung Ihrer Daten?", "ps": ["Die Rechtsgrundlage für die Verarbeitung Ihrer personenbezogenen Daten ist:"], "list": [
                "Das berechtigte Interesse von Burguar Dreams S.L.",
                "Die Einwilligung des Nutzers oder Kunden zur Verarbeitung seiner Daten.",
            ]},
            {"h": "An welche Empfänger werden die Daten weitergegeben?", "ps": [
                "Die personenbezogenen Daten des Nutzers können gegebenenfalls an Dritte weitergegeben werden, die vertraglich mit Burguar Dreams S.L. verbunden sind, zur Durchführung der für die Bearbeitung seiner Anfrage erforderlichen Aufgaben, ohne dass eine ausdrückliche Genehmigung erforderlich ist.",
                "Ebenso wenn es erforderlich ist, sich an die Behörden zu wenden, falls der Nutzer Handlungen vorgenommen hat, die gegen das Gesetz verstoßen, oder den Inhalt des Impressums verletzt hat.",
                "Die personenbezogenen Daten des Nutzers werden nicht an Drittländer oder internationale Organisationen übermittelt, es sei denn, der Nutzer wird ordnungsgemäß über diese Übermittlung, deren Bedingungen und Empfänger informiert.",
                "Wenn bestimmte Daten für den Zugang zu spezifischen Funktionen der Website obligatorisch sind, weist Burguar Dreams S.L. auf diesen obligatorischen Charakter zum Zeitpunkt der Erhebung hin.",
            ]},
            {"h": "Cookies", "ps": [
                "Beim Surfen auf dieser Website können Cookies von Burguar Dreams S.L. und/oder Dritten auf Ihrem Gerät installiert werden. Beim ersten Besuch erscheint ein informatives Banner über die Verwendung von Cookies.",
                "Durch Fortsetzen des Surfens gilt der Nutzer als informiert und als Einverständnis mit der Verwendung dieser Cookies. Die erteilte Einwilligung gilt dreizehn Monate.",
                "Weitere Informationen finden Sie in unserer Cookie-Richtlinie.",
            ]},
            {"h": "Rechte des Nutzers", "ps": [
                "Der Nutzer wird über die Möglichkeit informiert, seine Rechte auf Auskunft, Berichtigung, Löschung und Widerspruch auszuüben. Ebenso hat jede Person das Recht auf Einschränkung der Verarbeitung ihrer personenbezogenen Daten, auf Löschung der an den Verantwortlichen übermittelten Daten und auf Datenübertragbarkeit.",
                f"Der Nutzer hat die Möglichkeit, eine Beschwerde bei der {_aepd('de')} einzureichen, wenn er bei der Ausübung seiner Rechte keine zufriedenstellende Lösung erhalten hat.",
                f"Sofern der Nutzer nicht widerspricht, indem er eine E-Mail an {_mail()} sendet, können seine Daten verwendet werden, um ihm Informationen über Apartments und Dienstleistungen von Burguar Dreams S.L. zu senden.",
                "Die bereitgestellten Daten werden aufbewahrt, solange die Geschäftsbeziehung besteht oder für die zur Erfüllung gesetzlicher Verpflichtungen erforderlichen Jahre.",
                "Der Nutzer ist dafür verantwortlich, dass die über diese Website bereitgestellten Informationen wahrheitsgemäß sind, haftet für die Richtigkeit aller mitgeteilten Daten und hält diese aktuell, um seine tatsächliche Situation widerzuspiegeln.",
                "Diese Informationen werden vertraulich gespeichert und verwaltet, wobei die erforderlichen IT-Sicherheitsmaßnahmen angewendet werden, um unbefugten Zugriff oder Missbrauch der Daten, deren Manipulation, Verschlechterung oder Verlust zu verhindern.",
                "Der Nutzer muss jedoch berücksichtigen, dass die Sicherheit von Computersystemen niemals absolut ist. Bei der Online-Bereitstellung personenbezogener Daten können diese ohne seine Einwilligung erhoben und von unbefugten Dritten verarbeitet werden. Burguar Dreams S.L. lehnt jede Haftung für die Folgen solcher Handlungen ab, wenn der Nutzer die Informationen freiwillig veröffentlicht hat.",
                "Sie können diese Rechte durch schriftlichen Antrag an folgende Adresse ausüben:",
                "<strong>Burguar Dreams S.L.</strong><br>C/ Can Bruixa, 16, ent. 1º<br>08028 Barcelona",
                f"Oder per E-Mail an: {_mail()}, unter Beifügung einer Kopie des Personalausweises oder eines gleichwertigen Dokuments.",
                "Diese Anträge werden innerhalb eines Monats bearbeitet, verlängerbar auf zwei Monate, wenn die Komplexität oder Anzahl der Anträge dies erfordert, unbeschadet der Verpflichtung, bestimmte Daten für die gesetzlichen Fristen aufzubewahren.",
                "Ebenso haben Nutzer, die dies wünschen, die Möglichkeit, den Bestimmungsort ihrer Daten nach ihrem Tod zu regeln.",
            ]},
        ],
    },
    "it": {
        "title": "INFORMATIVA SULLA PRIVACY",
        "sections": [
            {"ps": [
                "Burguar Dreams S.L., al fine di proteggere i diritti individuali e di essere trasparente con l'Utente, ha stabilito una politica che include tutti i trattamenti dei dati, le finalità perseguite, la loro legittimità e gli strumenti disponibili affinché l'Utente possa esercitare i propri diritti.",
                f"La navigazione su questo sito web implica l'accettazione totale delle seguenti disposizioni. Si accetta l'uso dei cookie. Se non siete d'accordo, inviate un'email a {_mail()}.",
                "La versione aggiornata di questa informativa sulla privacy è l'unica applicabile per tutto il tempo in cui si utilizza il sito web, fino a quando non ne esista un'altra versione che la sostituisca.",
                f"Per ulteriori informazioni sulla protezione dei dati personali, vi invitiamo a consultare il sito web dell'{_aepd('it')}.",
            ]},
            {"h": "Raccolta dei dati", "ps": [
                "I vostri dati sono raccolti da Burguar Dreams S.L.",
                "I dati personali sono qualsiasi informazione relativa a una persona fisica identificata o identificabile. Si intende per persona identificabile colui che può essere identificato, direttamente o indirettamente, in particolare mediante un nome, un numero di identificazione (carta d'identità, codice fiscale, permesso di soggiorno, passaporto) o uno o più elementi specifici della sua identità fisica, fisiologica, genetica, psichica, economica, culturale o sociale.",
                "I dati generalmente raccolti sono: nome e cognome, indirizzo, email, numero di telefono, data di nascita e situazione lavorativa e reddito, nel contesto di richieste di informazioni sul noleggio di appartamenti. Potranno essere raccolti altri tipi di dati, informando l'utente in ogni caso.",
            ]},
            {"h": "Per quale finalità vengono trattati i vostri dati personali?", "ps": [
                "La finalità del trattamento dei dati personali che possono essere raccolti è il loro uso principale da parte di Burguar Dreams S.L. per la gestione del rapporto con voi, per potervi offrire appartamenti e servizi conformi alle vostre esigenze, per migliorare la vostra esperienza come utente e per gestire le vostre richieste di informazioni o prenotazione. Non verranno prese decisioni automatizzate basate sul vostro profilo.",
                "I dati forniti saranno conservati finché si mantiene il rapporto commerciale, sempre che l'interessato non ne richieda la cancellazione, o per gli anni necessari a adempiere agli obblighi legali.",
            ]},
            {"h": "Qual è la base giuridica del trattamento dei vostri dati?", "ps": ["La base giuridica per il trattamento dei vostri dati personali è:"], "list": [
                "Il legittimo interesse di Burguar Dreams S.L.",
                "Il consenso dell'utente o del cliente per il trattamento dei propri dati.",
            ]},
            {"h": "A quali destinatari saranno comunicati i dati?", "ps": [
                "I dati personali dell'Utente potranno essere comunicati eventualmente a terzi collegati a Burguar Dreams S.L. per contratto per lo svolgimento di compiti necessari alla gestione della sua richiesta, senza necessità di autorizzazione espressa.",
                "Anche quando fosse necessario comunicare con le autorità nel caso in cui l'Utente avesse compiuto azioni contrarie alla Legge o violato il contenuto delle Note Legali.",
                "I dati personali dell'Utente non saranno trasferiti a paesi terzi né a organizzazioni internazionali, salvo che l'Utente sia debitamente informato di tale trasferimento, delle sue condizioni e del destinatario.",
                "Quando determinati dati siano obbligatori per accedere a funzionalità specifiche del sito web, Burguar Dreams S.L. indicherà questo carattere obbligatorio al momento della raccolta.",
            ]},
            {"h": "Cookie", "ps": [
                "Navigando su questo sito web, i cookie di Burguar Dreams S.L. e/o di terzi possono essere installati sul vostro dispositivo. Durante la prima navigazione, apparirà un banner informativo sull'uso dei cookie.",
                "Continuando la navigazione, l'Utente sarà considerato informato e avrà accettato l'uso di tali cookie. Il consenso prestato avrà validità di tredici mesi.",
                "Per maggiori informazioni, consultate la nostra Informativa sui Cookie.",
            ]},
            {"h": "Diritti dell'utente", "ps": [
                "Si informa l'utente della possibilità di esercitare i propri diritti di accesso, rettifica, cancellazione e opposizione. Inoltre, ogni persona ha diritto alla limitazione del trattamento dei propri dati personali, alla cancellazione dei dati trasmessi al titolare del trattamento e alla portabilità dei propri dati.",
                f"L'utente ha la possibilità di presentare un reclamo presso l'{_aepd('it')} quando non abbia ottenuto una soluzione soddisfacente nell'esercizio dei propri diritti.",
                f"Salvo che l'Utente si opponga, inviando un'email a {_mail()}, i suoi dati potranno essere utilizzati per inviargli informazioni su appartamenti e servizi di Burguar Dreams S.L.",
                "I dati forniti saranno conservati finché si mantiene il rapporto commerciale o per gli anni necessari a adempiere agli obblighi legali.",
                "L'Utente è responsabile del fatto che le informazioni fornite tramite questo sito web siano veritiere, rispondendo dell'accuratezza di tutti i dati comunicati e mantenendoli aggiornati per riflettere la propria situazione reale.",
                "Queste informazioni saranno archiviate e gestite con la dovuta riservatezza, applicando le misure di sicurezza informatica necessarie per evitare l'accesso o l'uso indebito dei dati, la loro manipolazione, deterioramento o perdita.",
                "Tuttavia, l'Utente deve tenere presente che la sicurezza dei sistemi informatici non è mai assoluta. Fornendo dati personali online, tali informazioni possono essere raccolte senza il suo consenso e trattate da terzi non autorizzati. Burguar Dreams S.L. declina ogni responsabilità per le conseguenze di tali atti se l'Utente ha pubblicato le informazioni volontariamente.",
                "Potrete esercitare questi diritti mediante richiesta scritta indirizzata a:",
                "<strong>Burguar Dreams S.L.</strong><br>C/ Can Bruixa, 16, ent. 1º<br>08028 Barcelona",
                f"O via email a: {_mail()}, allegando copia del documento d'identità o documento equivalente.",
                "Tali richieste saranno evase entro un mese, prorogabile a due mesi se la complessità o il numero di richieste lo richiedono, senza pregiudizio dell'obbligo di conservare determinati dati nei termini legali.",
                "Inoltre, gli utenti che lo richiedano hanno la possibilità di organizzare la destinazione dei propri dati dopo il decesso.",
            ]},
        ],
    },
}
