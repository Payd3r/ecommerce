/**
 * Elenco di paesi, province/regioni e città per la selezione geografica nei form
 * @type {Array<{code: string, name: string, provinces: Array<{code: string, name: string, cities: string[]}>}>}
 */
export const countries = [
    {
      code: 'IT',
      name: 'Italia',
      provinces: [
        // NORD-OVEST
        { code: 'TO', name: 'Torino', cities: ['Torino', 'Moncalieri', 'Collegno', 'Rivoli', 'Nichelino', 'Settimo Torinese', 'Pinerolo', 'Ivrea'] },
        { code: 'VC', name: 'Vercelli', cities: ['Vercelli', 'Borgosesia', 'Santhià', 'Gattinara'] },
        { code: 'NO', name: 'Novara', cities: ['Novara', 'Borgomanero', 'Trecate', 'Arona'] },
        { code: 'CN', name: 'Cuneo', cities: ['Cuneo', 'Alba', 'Bra', 'Fossano', 'Mondovì', 'Saluzzo'] },
        { code: 'AT', name: 'Asti', cities: ['Asti', 'Canelli', 'Nizza Monferrato', 'San Damiano d\'Asti'] },
        { code: 'AL', name: 'Alessandria', cities: ['Alessandria', 'Casale Monferrato', 'Novi Ligure', 'Tortona', 'Acqui Terme'] },
        { code: 'BI', name: 'Biella', cities: ['Biella', 'Cossato', 'Valdilana', 'Vigliano Biellese'] },
        { code: 'VB', name: 'Verbano-Cusio-Ossola', cities: ['Verbania', 'Domodossola', 'Omegna', 'Gravellona Toce'] },
        { code: 'AO', name: 'Valle d\'Aosta/Vallée d\'Aoste', cities: ['Aosta', 'Saint-Vincent', 'Châtillon', 'Sarre', 'Courmayeur'] }, // Regione autonoma con funzioni provinciali
        { code: 'GE', name: 'Genova', cities: ['Genova', 'Rapallo', 'Chiavari', 'Sestri Levante', 'Lavagna'] },
        { code: 'IM', name: 'Imperia', cities: ['Imperia', 'Sanremo', 'Ventimiglia', 'Taggia'] },
        { code: 'SP', name: 'La Spezia', cities: ['La Spezia', 'Sarzana', 'Lerici', 'Arcola'] },
        { code: 'SV', name: 'Savona', cities: ['Savona', 'Albenga', 'Varazze', 'Cairo Montenotte'] },
        { code: 'MI', name: 'Milano', cities: ['Milano', 'Sesto San Giovanni', 'Cinisello Balsamo', 'Legnano', 'Rho', 'Paderno Dugnano'] },
        { code: 'BG', name: 'Bergamo', cities: ['Bergamo', 'Treviglio', 'Seriate', 'Dalmine'] },
        { code: 'BS', name: 'Brescia', cities: ['Brescia', 'Desenzano del Garda', 'Lumezzane', 'Montichiari'] },
        { code: 'CO', name: 'Como', cities: ['Como', 'Cantù', 'Mariano Comense', 'Erba', 'Olgiate Comasco'] },
        { code: 'CR', name: 'Cremona', cities: ['Cremona', 'Crema', 'Casalmaggiore', 'Castelleone'] },
        { code: 'LC', name: 'Lecco', cities: ['Lecco', 'Merate', 'Calolziocorte', 'Casatenovo'] },
        { code: 'LO', name: 'Lodi', cities: ['Lodi', 'Codogno', 'Casalpusterlengo', 'Sant\'Angelo Lodigiano'] },
        { code: 'MN', name: 'Mantova', cities: ['Mantova', 'Castiglione delle Stiviere', 'Suzzara', 'Viadana'] },
        { code: 'MB', name: 'Monza e Brianza', cities: ['Monza', 'Lissone', 'Seregno', 'Desio', 'Cesano Maderno'] },
        { code: 'PV', name: 'Pavia', cities: ['Pavia', 'Vigevano', 'Voghera', 'Mortara'] },
        { code: 'SO', name: 'Sondrio', cities: ['Sondrio', 'Morbegno', 'Tirano', 'Chiavenna'] },
        { code: 'VA', name: 'Varese', cities: ['Varese', 'Busto Arsizio', 'Gallarate', 'Saronno'] },
        // NORD-EST
        { code: 'BZ', name: 'Bolzano/Bozen', cities: ['Bolzano', 'Merano', 'Bressanone', 'Laives', 'Brunico'] }, // Provincia autonoma
        { code: 'TN', name: 'Trento', cities: ['Trento', 'Rovereto', 'Pergine Valsugana', 'Arco', 'Riva del Garda'] }, // Provincia autonoma
        { code: 'VE', name: 'Venezia', cities: ['Venezia', 'Chioggia', 'San Donà di Piave', 'Mira', 'Spinea', 'Jesolo'] },
        { code: 'PD', name: 'Padova', cities: ['Padova', 'Albignasego', 'Selvazzano Dentro', 'Vigonza', 'Cittadella'] },
        { code: 'VR', name: 'Verona', cities: ['Verona', 'Villafranca di Verona', 'Legnago', 'San Bonifacio'] },
        { code: 'TV', name: 'Treviso', cities: ['Treviso', 'Conegliano', 'Castelfranco Veneto', 'Montebelluna', 'Vittorio Veneto'] },
        { code: 'VI', name: 'Vicenza', cities: ['Vicenza', 'Bassano del Grappa', 'Schio', 'Valdagno'] },
        { code: 'RO', name: 'Rovigo', cities: ['Rovigo', 'Adria', 'Porto Viro', 'Occhiobello'] },
        { code: 'BL', name: 'Belluno', cities: ['Belluno', 'Feltre', 'Sedico', 'Ponte nelle Alpi'] },
        { code: 'UD', name: 'Udine', cities: ['Udine', 'Codroipo', 'Tavagnacco', 'Cervignano del Friuli', 'Latisana'] },
        { code: 'GO', name: 'Gorizia', cities: ['Gorizia', 'Monfalcone', 'Ronchi dei Legionari', 'Grado'] },
        { code: 'PN', name: 'Pordenone', cities: ['Pordenone', 'Sacile', 'Cordenons', 'Porcia'] },
        { code: 'TS', name: 'Trieste', cities: ['Trieste', 'Muggia', 'Duino-Aurisina', 'San Dorligo della Valle'] },
        { code: 'BO', name: 'Bologna', cities: ['Bologna', 'Imola', 'Casalecchio di Reno', 'San Lazzaro di Savena', 'Valsamoggia'] },
        { code: 'FE', name: 'Ferrara', cities: ['Ferrara', 'Cento', 'Comacchio', 'Argenta'] },
        { code: 'FC', name: 'Forlì-Cesena', cities: ['Forlì', 'Cesena', 'Cesenatico', 'Savignano sul Rubicone'] },
        { code: 'MO', name: 'Modena', cities: ['Modena', 'Carpi', 'Sassuolo', 'Formigine', 'Castelfranco Emilia'] },
        { code: 'PR', name: 'Parma', cities: ['Parma', 'Fidenza', 'Salsomaggiore Terme', 'Collecchio'] },
        { code: 'PC', name: 'Piacenza', cities: ['Piacenza', 'Fiorenzuola d\'Arda', 'Castel San Giovanni', 'Rottofreno'] },
        { code: 'RA', name: 'Ravenna', cities: ['Ravenna', 'Faenza', 'Lugo', 'Cervia'] },
        { code: 'RE', name: 'Reggio Emilia', cities: ['Reggio Emilia', 'Scandiano', 'Correggio', 'Casalgrande'] },
        { code: 'RN', name: 'Rimini', cities: ['Rimini', 'Riccione', 'Santarcangelo di Romagna', 'Cattolica'] },
        // CENTRO
        { code: 'FI', name: 'Firenze', cities: ['Firenze', 'Scandicci', 'Sesto Fiorentino', 'Empoli', 'Campi Bisenzio'] },
        { code: 'AR', name: 'Arezzo', cities: ['Arezzo', 'Montevarchi', 'Cortona', 'San Giovanni Valdarno'] },
        { code: 'GR', name: 'Grosseto', cities: ['Grosseto', 'Follonica', 'Orbetello', 'Monte Argentario'] },
        { code: 'LI', name: 'Livorno', cities: ['Livorno', 'Piombino', 'Rosignano Marittimo', 'Cecina', 'Portoferraio'] },
        { code: 'LU', name: 'Lucca', cities: ['Lucca', 'Viareggio', 'Capannori', 'Camaiore'] },
        { code: 'MS', name: 'Massa-Carrara', cities: ['Massa', 'Carrara', 'Aulla', 'Montignoso'] },
        { code: 'PI', name: 'Pisa', cities: ['Pisa', 'Cascina', 'San Giuliano Terme', 'Pontedera', 'Volterra'] },
        { code: 'PT', name: 'Pistoia', cities: ['Pistoia', 'Quarrata', 'Monsummano Terme', 'Montecatini Terme'] },
        { code: 'PO', name: 'Prato', cities: ['Prato', 'Montemurlo', 'Carmignano', 'Vaiano'] },
        { code: 'SI', name: 'Siena', cities: ['Siena', 'Poggibonsi', 'Colle di Val d\'Elsa', 'Montepulciano'] },
        { code: 'PG', name: 'Perugia', cities: ['Perugia', 'Foligno', 'Città di Castello', 'Spoleto', 'Gubbio', 'Assisi'] },
        { code: 'TR', name: 'Terni', cities: ['Terni', 'Orvieto', 'Narni', 'Amelia'] },
        { code: 'AN', name: 'Ancona', cities: ['Ancona', 'Senigallia', 'Jesi', 'Fabriano', 'Osimo'] },
        { code: 'AP', name: 'Ascoli Piceno', cities: ['Ascoli Piceno', 'San Benedetto del Tronto', 'Grottammare', 'Monteprandone'] },
        { code: 'FM', name: 'Fermo', cities: ['Fermo', 'Porto Sant\'Elpidio', 'Sant\'Elpidio a Mare', 'Porto San Giorgio'] },
        { code: 'MC', name: 'Macerata', cities: ['Macerata', 'Civitanova Marche', 'Recanati', 'Tolentino'] },
        { code: 'PU', name: 'Pesaro e Urbino', cities: ['Pesaro', 'Fano', 'Urbino', 'Vallefoglia'] },
        { code: 'RM', name: 'Roma', cities: ['Roma', 'Guidonia Montecelio', 'Fiumicino', 'Pomezia', 'Tivoli', 'Civitavecchia'] },
        { code: 'FR', name: 'Frosinone', cities: ['Frosinone', 'Cassino', 'Alatri', 'Sora'] },
        { code: 'LT', name: 'Latina', cities: ['Latina', 'Aprilia', 'Terracina', 'Fondi', 'Formia'] },
        { code: 'RI', name: 'Rieti', cities: ['Rieti', 'Fara in Sabina', 'Cittaducale', 'Poggio Mirteto'] },
        { code: 'VT', name: 'Viterbo', cities: ['Viterbo', 'Civita Castellana', 'Tarquinia', 'Montefiascone'] },
        { code: 'AQ', name: 'L\'Aquila', cities: ['L\'Aquila', 'Avezzano', 'Sulmona', 'Celano'] },
        { code: 'CH', name: 'Chieti', cities: ['Chieti', 'Vasto', 'Lanciano', 'Francavilla al Mare'] },
        { code: 'PE', name: 'Pescara', cities: ['Pescara', 'Montesilvano', 'Spoltore', 'Città Sant\'Angelo'] },
        { code: 'TE', name: 'Teramo', cities: ['Teramo', 'Giulianova', 'Roseto degli Abruzzi', 'Silvi'] },
        { code: 'CB', name: 'Campobasso', cities: ['Campobasso', 'Termoli', 'Larino', 'Bojano'] },
        { code: 'IS', name: 'Isernia', cities: ['Isernia', 'Venafro', 'Agnone', 'Frosolone'] },
        // SUD
        { code: 'NA', name: 'Napoli', cities: ['Napoli', 'Giugliano in Campania', 'Torre del Greco', 'Pozzuoli', 'Casoria', 'Pompei', 'Ercolano'] },
        { code: 'AV', name: 'Avellino', cities: ['Avellino', 'Ariano Irpino', 'Mercogliano', 'Solofra'] },
        { code: 'BN', name: 'Benevento', cities: ['Benevento', 'Montesarchio', 'Sant\'Agata de\' Goti', 'San Giorgio del Sannio'] },
        { code: 'CE', name: 'Caserta', cities: ['Caserta', 'Aversa', 'Marcianise', 'Maddaloni', 'Santa Maria Capua Vetere'] },
        { code: 'SA', name: 'Salerno', cities: ['Salerno', 'Cava de\' Tirreni', 'Battipaglia', 'Scafati', 'Nocera Inferiore', 'Eboli'] },
        { code: 'BA', name: 'Bari', cities: ['Bari', 'Altamura', 'Molfetta', 'Bitonto', 'Monopoli', 'Corato'] },
        { code: 'BT', name: 'Barletta-Andria-Trani', cities: ['Barletta', 'Andria', 'Trani', 'Bisceglie', 'Canosa di Puglia'] },
        { code: 'BR', name: 'Brindisi', cities: ['Brindisi', 'Fasano', 'Francavilla Fontana', 'Ostuni'] },
        { code: 'FG', name: 'Foggia', cities: ['Foggia', 'Cerignola', 'Manfredonia', 'San Severo', 'Lucera'] },
        { code: 'LE', name: 'Lecce', cities: ['Lecce', 'Nardò', 'Galatina', 'Copertino', 'Gallipoli'] },
        { code: 'TA', name: 'Taranto', cities: ['Taranto', 'Martina Franca', 'Massafra', 'Grottaglie'] },
        { code: 'PZ', name: 'Potenza', cities: ['Potenza', 'Melfi', 'Lauria', 'Lavello'] },
        { code: 'MT', name: 'Matera', cities: ['Matera', 'Policoro', 'Pisticci', 'Bernalda'] },
        { code: 'CS', name: 'Cosenza', cities: ['Cosenza', 'Corigliano-Rossano', 'Rende', 'Castrovillari'] },
        { code: 'CZ', name: 'Catanzaro', cities: ['Catanzaro', 'Lamezia Terme', 'Soverato', 'Borgia'] },
        { code: 'KR', name: 'Crotone', cities: ['Crotone', 'Isola di Capo Rizzuto', 'Cirò Marina', 'Cutro'] },
        { code: 'RC', name: 'Reggio Calabria', cities: ['Reggio Calabria', 'Gioia Tauro', 'Palmi', 'Siderno', 'Taurianova'] },
        { code: 'VV', name: 'Vibo Valentia', cities: ['Vibo Valentia', 'Pizzo', 'Mileto', 'Serra San Bruno'] },
        // ISOLE
        { code: 'PA', name: 'Palermo', cities: ['Palermo', 'Bagheria', 'Monreale', 'Carini', 'Partinico', 'Termini Imerese'] },
        { code: 'AG', name: 'Agrigento', cities: ['Agrigento', 'Sciacca', 'Licata', 'Canicattì'] },
        { code: 'CL', name: 'Caltanissetta', cities: ['Caltanissetta', 'Gela', 'Niscemi', 'San Cataldo'] },
        { code: 'CT', name: 'Catania', cities: ['Catania', 'Acireale', 'Paternò', 'Misterbianco', 'Caltagirone'] },
        { code: 'EN', name: 'Enna', cities: ['Enna', 'Piazza Armerina', 'Nicosia', 'Leonforte'] },
        { code: 'ME', name: 'Messina', cities: ['Messina', 'Barcellona Pozzo di Gotto', 'Milazzo', 'Patti', 'Taormina'] },
        { code: 'RG', name: 'Ragusa', cities: ['Ragusa', 'Vittoria', 'Modica', 'Comiso'] },
        { code: 'SR', name: 'Siracusa', cities: ['Siracusa', 'Augusta', 'Avola', 'Noto', 'Lentini'] },
        { code: 'TP', name: 'Trapani', cities: ['Trapani', 'Marsala', 'Mazara del Vallo', 'Alcamo', 'Castelvetrano'] },
        { code: 'CA', name: 'Cagliari', cities: ['Cagliari', 'Quartu Sant\'Elena', 'Selargius', 'Assemini', 'Capoterra'] },
        { code: 'NU', name: 'Nuoro', cities: ['Nuoro', 'Siniscola', 'Macomer', 'Dorgali'] },
        { code: 'OR', name: 'Oristano', cities: ['Oristano', 'Terralba', 'Cabras', 'Bosa'] },
        { code: 'SS', name: 'Sassari', cities: ['Sassari', 'Alghero', 'Porto Torres', 'Sorso', 'Ozieri', 'Olbia'] }, // Olbia era capoluogo con Tempio Pausania della provincia Olbia-Tempio, ora assorbita
        { code: 'SU', name: 'Sud Sardegna', cities: ['Carbonia', 'Iglesias', 'Villacidro', 'Guspini', 'Sant\'Antioco'] } // Capoluogo provvisorio Carbonia
      ]
    },
    {
      code: 'FR',
      name: 'Francia', // Metropolitan France
      provinces: [ // In Francia sono Regioni (Régions)
        { code: 'ARA', name: 'Alvernia-Rodano-Alpi (Auvergne-Rhône-Alpes)', cities: ['Lione (Lyon)', 'Grenoble', 'Saint-Étienne', 'Clermont-Ferrand', 'Annecy', 'Chambéry'] },
        { code: 'BFC', name: 'Borgogna-Franca Contea (Bourgogne-Franche-Comté)', cities: ['Digione (Dijon)', 'Besançon', 'Chalon-sur-Saône', 'Nevers', 'Auxerre'] },
        { code: 'BRE', name: 'Bretagna (Bretagne)', cities: ['Rennes', 'Brest', 'Quimper', 'Lorient', 'Vannes'] },
        { code: 'CVL', name: 'Centro-Val della Loira (Centre-Val de Loire)', cities: ['Orléans', 'Tours', 'Bourges', 'Blois', 'Chartres'] },
        { code: 'COR', name: 'Corsica (Corse)', cities: ['Ajaccio', 'Bastia', 'Porto-Vecchio', 'Corte'] }, // Collettività territoriale unica
        { code: 'GES', name: 'Grand Est', cities: ['Strasburgo (Strasbourg)', 'Reims', 'Metz', 'Mulhouse', 'Nancy', 'Colmar'] },
        { code: 'HDF', name: 'Alta Francia (Hauts-de-France)', cities: ['Lilla (Lille)', 'Amiens', 'Roubaix', 'Tourcoing', 'Dunkerque', 'Calais'] },
        { code: 'IDF', name: 'Île-de-France', cities: ['Parigi (Paris)', 'Boulogne-Billancourt', 'Saint-Denis', 'Argenteuil', 'Montreuil', 'Versailles'] },
        { code: 'NOR', name: 'Normandia (Normandie)', cities: ['Rouen', 'Caen', 'Le Havre', 'Cherbourg-en-Cotentin', 'Évreux'] },
        { code: 'NAQ', name: 'Nuova Aquitania (Nouvelle-Aquitaine)', cities: ['Bordeaux', 'Limoges', 'Poitiers', 'Pau', 'La Rochelle', 'Bayonne'] },
        { code: 'OCC', name: 'Occitania (Occitanie)', cities: ['Tolosa (Toulouse)', 'Montpellier', 'Nîmes', 'Perpignan', 'Béziers', 'Carcassonne'] },
        { code: 'PDL', name: 'Paesi della Loira (Pays de la Loire)', cities: ['Nantes', 'Angers', 'Le Mans', 'Saint-Nazaire', 'Cholet'] },
        { code: 'PAC', name: 'Provenza-Alpi-Costa Azzurra (Provence-Alpes-Côte d\'Azur)', cities: ['Marsiglia (Marseille)', 'Nizza (Nice)', 'Tolone (Toulon)', 'Aix-en-Provence', 'Avignone (Avignon)', 'Cannes'] }
        // Nota: Non includo i dipartimenti e territori d'oltremare per brevità, ma sono parte della Francia.
      ]
    },
    {
      code: 'CH',
      name: 'Svizzera',
      provinces: [ // In Svizzera sono Cantoni (Kantone/Cantons/Cantoni)
        { code: 'AG', name: 'Argovia (Aargau)', cities: ['Aarau', 'Baden', 'Wettingen', 'Wohlen', 'Rheinfelden'] },
        { code: 'AI', name: 'Appenzello Interno (Appenzell Innerrhoden)', cities: ['Appenzello (Appenzell)', 'Oberegg', 'Rüte'] }, // Appenzello è il capoluogo
        { code: 'AR', name: 'Appenzello Esterno (Appenzell Ausserrhoden)', cities: ['Herisau', 'Teufen', 'Heiden', 'Speicher'] }, // Herisau è la sede del governo cantonale
        { code: 'BS', name: 'Basilea Città (Basel-Stadt)', cities: ['Basilea (Basel)', 'Riehen', 'Bettingen'] },
        { code: 'BL', name: 'Basilea Campagna (Basel-Landschaft)', cities: ['Liestal', 'Allschwil', 'Reinach', 'Muttenz', 'Pratteln'] },
        { code: 'BE', name: 'Berna (Bern)', cities: ['Berna (Bern)', 'Biel/Bienne', 'Thun', 'Köniz', 'Ostermundigen', 'Interlaken'] },
        { code: 'FR', name: 'Friburgo (Freiburg/Fribourg)', cities: ['Friburgo (Fribourg)', 'Bulle', 'Villars-sur-Glâne', 'Murten'] },
        { code: 'GE', name: 'Ginevra (Genève)', cities: ['Ginevra (Genève)', 'Vernier', 'Lancy', 'Meyrin', 'Carouge'] },
        { code: 'GL', name: 'Glarona (Glarus)', cities: ['Glarona (Glarus)', 'Näfels', 'Niederurnen'] }, // Glarus, Glarus Nord, Glarus Süd sono i 3 comuni
        { code: 'GR', name: 'Grigioni (Graubünden)', cities: ['Coira (Chur)', 'Davos', 'St. Moritz', 'Poschiavo', 'Roveredo'] },
        { code: 'JU', name: 'Giura (Jura)', cities: ['Delémont', 'Porrentruy', 'Saignelégier'] },
        { code: 'LU', name: 'Lucerna (Luzern)', cities: ['Lucerna (Luzern)', 'Emmen', 'Kriens', 'Horw'] },
        { code: 'NE', name: 'Neuchâtel', cities: ['Neuchâtel', 'La Chaux-de-Fonds', 'Le Locle', 'Val-de-Ruz'] },
        { code: 'NW', name: 'Nidvaldo (Nidwalden)', cities: ['Stans', 'Hergiswil', 'Buochs', 'Ennetbürgen'] },
        { code: 'OW', name: 'Obvaldo (Obwalden)', cities: ['Sarnen', 'Kerns', 'Alpnach', 'Engelberg'] },
        { code: 'SG', name: 'San Gallo (St. Gallen)', cities: ['San Gallo (St. Gallen)', 'Rapperswil-Jona', 'Gossau', 'Wil'] },
        { code: 'SH', name: 'Sciaffusa (Schaffhausen)', cities: ['Sciaffusa (Schaffhausen)', 'Neuhausen am Rheinfall', 'Thayngen'] },
        { code: 'SZ', name: 'Svitto (Schwyz)', cities: ['Svitto (Schwyz)', 'Einsiedeln', 'Küssnacht', 'Arth'] },
        { code: 'SO', name: 'Soletta (Solothurn)', cities: ['Soletta (Solothurn)', 'Olten', 'Grenchen', 'Zuchwil'] },
        { code: 'TG', name: 'Turgovia (Thurgau)', cities: ['Frauenfeld', 'Kreuzlingen', 'Arbon', 'Amriswil'] },
        { code: 'TI', name: 'Ticino', cities: ['Bellinzona', 'Lugano', 'Mendrisio', 'Locarno', 'Chiasso', 'Minusio'] },
        { code: 'UR', name: 'Uri', cities: ['Altdorf', 'Erstfeld', 'Bürglen'] },
        { code: 'VS', name: 'Valais/Wallis (Vallese)', cities: ['Sion (Sitten)', 'Martigny', 'Monthey', 'Sierre (Siders)', 'Brig-Glis', 'Zermatt'] },
        { code: 'VD', name: 'Vaud', cities: ['Losanna (Lausanne)', 'Yverdon-les-Bains', 'Montreux', 'Nyon', 'Vevey', 'Renens'] },
        { code: 'ZG', name: 'Zugo (Zug)', cities: ['Zugo (Zug)', 'Baar', 'Cham', 'Risch'] },
        { code: 'ZH', name: 'Zurigo (Zürich)', cities: ['Zurigo (Zürich)', 'Winterthur', 'Uster', 'Dübendorf', 'Dietikon', 'Wetzikon'] }
      ]
    },
    {
      code: 'DE',
      name: 'Germania',
      provinces: [ // In Germania sono Stati federati (Länder)
        { code: 'BW', name: 'Baden-Württemberg', cities: ['Stoccarda (Stuttgart)', 'Mannheim', 'Karlsruhe', 'Friburgo in Brisgovia (Freiburg im Breisgau)', 'Heidelberg', 'Ulma (Ulm)'] },
        { code: 'BY', name: 'Baviera (Bayern)', cities: ['Monaco di Baviera (München)', 'Norimberga (Nürnberg)', 'Augusta (Augsburg)', 'Ratisbona (Regensburg)', 'Würzburg', 'Ingolstadt'] },
        { code: 'BE', name: 'Berlino (Berlin)', cities: ['Berlino (Berlin)'] }, // Città-stato
        { code: 'BB', name: 'Brandeburgo (Brandenburg)', cities: ['Potsdam', 'Cottbus', 'Brandeburgo sulla Havel (Brandenburg an der Havel)', 'Francoforte sull\'Oder (Frankfurt (Oder))'] },
        { code: 'HB', name: 'Brema (Bremen)', cities: ['Brema (Bremen)', 'Bremerhaven'] }, // Città-stato (composta da due città)
        { code: 'HH', name: 'Amburgo (Hamburg)', cities: ['Amburgo (Hamburg)'] }, // Città-stato
        { code: 'HE', name: 'Assia (Hessen)', cities: ['Wiesbaden', 'Francoforte sul Meno (Frankfurt am Main)', 'Kassel', 'Darmstadt', 'Offenbach am Main'] },
        { code: 'MV', name: 'Meclemburgo-Pomerania Anteriore (Mecklenburg-Vorpommern)', cities: ['Schwerin', 'Rostock', 'Neubrandenburg', 'Stralsund', 'Greifswald'] },
        { code: 'NI', name: 'Bassa Sassonia (Niedersachsen)', cities: ['Hannover', 'Braunschweig', 'Oldenburg', 'Osnabrück', 'Wolfsburg', 'Gottinga (Göttingen)'] },
        { code: 'NW', name: 'Renania Settentrionale-Vestfalia (Nordrhein-Westfalen)', cities: ['Düsseldorf', 'Colonia (Köln)', 'Dortmund', 'Essen', 'Duisburg', 'Bonn', 'Aquisgrana (Aachen)'] },
        { code: 'RP', name: 'Renania-Palatinato (Rheinland-Pfalz)', cities: ['Magonza (Mainz)', 'Ludwigshafen am Rhein', 'Coblenza (Koblenz)', 'Treviri (Trier)', 'Kaiserslautern'] },
        { code: 'SL', name: 'Saarland', cities: ['Saarbrücken', 'Neunkirchen', 'Homburg', 'Völklingen'] },
        { code: 'SN', name: 'Sassonia (Sachsen)', cities: ['Dresda (Dresden)', 'Lipsia (Leipzig)', 'Chemnitz', 'Zwickau', 'Plauen'] },
        { code: 'ST', name: 'Sassonia-Anhalt (Sachsen-Anhalt)', cities: ['Magdeburgo (Magdeburg)', 'Halle (Saale)', 'Dessau-Roßlau', 'Wittenberg'] },
        { code: 'SH', name: 'Schleswig-Holstein', cities: ['Kiel', 'Lubecca (Lübeck)', 'Flensburgo (Flensburg)', 'Neumünster'] },
        { code: 'TH', name: 'Turingia (Thüringen)', cities: ['Erfurt', 'Jena', 'Gera', 'Weimar'] }
      ]
    }
  ];