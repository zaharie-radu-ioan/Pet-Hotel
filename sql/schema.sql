DROP TABLE IF EXISTS token_reinnoire;
DROP TABLE IF EXISTS activitate;
DROP TABLE IF EXISTS plata;
DROP TABLE IF EXISTS cazare_serviciu;
DROP TABLE IF EXISTS serviciu;
DROP TABLE IF EXISTS cazare;
DROP TABLE IF EXISTS camera;
DROP TABLE IF EXISTS rezervare;
DROP TABLE IF EXISTS preferinta;
DROP TABLE IF EXISTS problema;
DROP TABLE IF EXISTS animal;
DROP TABLE IF EXISTS client;
DROP TABLE IF EXISTS angajat;
DROP TABLE IF EXISTS utilizator;

CREATE TABLE IF NOT EXISTS utilizator (
    id_utilizator INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(70) NOT NULL UNIQUE,
    parola VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'angajat', 'client') NOT NULL DEFAULT 'client',
    activ BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS token_reinnoire (
    id_token      INT AUTO_INCREMENT PRIMARY KEY,
    id_utilizator INT NOT NULL,
    hash_token    VARCHAR(64) NOT NULL UNIQUE,
    id_familie    VARCHAR(36) NOT NULL,
    revocat       BOOLEAN DEFAULT FALSE,
    expira_la     TIMESTAMP NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_utilizator) REFERENCES utilizator(id_utilizator) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS angajat (
    id_angajat INT AUTO_INCREMENT PRIMARY KEY,
    nume VARCHAR(50) NOT NULL,
    prenume VARCHAR(50) NOT NULL,
    telefon VARCHAR(15),
    id_utilizator INT UNIQUE NOT NULL,
    FOREIGN KEY (id_utilizator) REFERENCES utilizator(id_utilizator) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS client (
    id_client INT AUTO_INCREMENT PRIMARY KEY,
    id_utilizator INT UNIQUE NOT NULL,
    nume VARCHAR(50) NOT NULL,
    prenume VARCHAR(50) NOT NULL,
    telefon VARCHAR(15),
    adresa VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_utilizator) REFERENCES utilizator(id_utilizator) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS animal (
    id_animal INT AUTO_INCREMENT PRIMARY KEY,
    nume VARCHAR(50) NOT NULL,
    specie VARCHAR(50) NOT NULL,
    rasa VARCHAR(100),
    sex ENUM('M', 'F'),
    data_nasterii DATE,
    greutate DECIMAL(5,2) CHECK (greutate IS NULL OR greutate > 0),
    sterilizat BOOLEAN DEFAULT FALSE,
    observatii TEXT,
    id_client INT NOT NULL,
    FOREIGN KEY (id_client) REFERENCES client(id_client) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS preferinta (
    id_preferinta INT AUTO_INCREMENT PRIMARY KEY,
    categorie VARCHAR(50) NOT NULL,
    descriere TEXT NOT NULL,
    id_animal INT NOT NULL,
    FOREIGN KEY (id_animal) REFERENCES animal(id_animal) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS problema (
    id_problema INT AUTO_INCREMENT PRIMARY KEY,
    descriere TEXT NOT NULL,
    id_animal INT NOT NULL,
    FOREIGN KEY (id_animal) REFERENCES animal(id_animal) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS camera (
    id_camera INT AUTO_INCREMENT PRIMARY KEY,
    cod VARCHAR(20) NOT NULL UNIQUE,
    tip_camera VARCHAR(50) NOT NULL,
    pret_noapte DECIMAL(10,2) NOT NULL CHECK (pret_noapte >= 0),
    status ENUM('libera', 'ocupata', 'indisponibila') DEFAULT 'libera',
    INDEX idx_camera_tip (tip_camera)
);

CREATE TABLE IF NOT EXISTS rezervare (
    id_rezervare INT AUTO_INCREMENT PRIMARY KEY,
    cod CHAR(36) NOT NULL UNIQUE,
    data_inceput DATE NOT NULL,
    data_final DATE NOT NULL CHECK (data_final >= data_inceput),
    status ENUM('ceruta', 'confirmata', 'in_desfasurare', 'finalizata', 'anulata') DEFAULT 'ceruta',
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (total >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_client INT NOT NULL,
    FOREIGN KEY (id_client) REFERENCES client(id_client) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS cazare (
    id_cazare INT AUTO_INCREMENT PRIMARY KEY,
    data_check_in DATETIME NOT NULL,
    data_check_out DATETIME NOT NULL CHECK (data_check_out > data_check_in),
    pret_camera_noapte DECIMAL(10,2) NOT NULL CHECK (pret_camera_noapte >= 0),
    observatii TEXT,
    nume_animal VARCHAR(50) NOT NULL,
    specie_animal VARCHAR(50) NOT NULL,
    rasa_animal VARCHAR(100),
    id_rezervare INT NOT NULL,
    FOREIGN KEY (id_rezervare) REFERENCES rezervare(id_rezervare) ON DELETE CASCADE,
    id_animal INT,
    FOREIGN KEY (id_animal) REFERENCES animal(id_animal) ON DELETE SET NULL,
    id_camera INT NOT NULL,
    FOREIGN KEY (id_camera) REFERENCES camera(id_camera) ON DELETE RESTRICT,
    INDEX idx_cazare_camera_interval (id_camera, data_check_in, data_check_out),
    INDEX idx_cazare_animal_interval (id_animal, data_check_in, data_check_out)
);

CREATE TABLE IF NOT EXISTS serviciu (
    id_serviciu INT AUTO_INCREMENT PRIMARY KEY,
    tip ENUM('serviciu', 'pachet') NOT NULL DEFAULT 'serviciu',
    denumire VARCHAR(100) NOT NULL UNIQUE,
    descriere TEXT,
    continut JSON NULL CHECK (continut IS NULL OR JSON_VALID(continut)),
    pret_curent DECIMAL(10,2) NOT NULL CHECK (pret_curent >= 0),
    durata_minute INT,
    activ BOOLEAN DEFAULT TRUE,
    INDEX idx_serviciu_tip (tip)
);

CREATE TABLE IF NOT EXISTS cazare_serviciu (
    id_cazare_serviciu INT AUTO_INCREMENT PRIMARY KEY,
    cantitate INT NOT NULL DEFAULT 1 CHECK (cantitate > 0),
    pret_aplicat DECIMAL(10,2) NOT NULL CHECK (pret_aplicat >= 0),
    data_programata DATETIME,
    status ENUM('programat', 'efectuat', 'anulat') DEFAULT 'programat',
    id_cazare INT NOT NULL,
    FOREIGN KEY (id_cazare) REFERENCES cazare(id_cazare) ON DELETE CASCADE,
    id_serviciu INT NOT NULL,
    FOREIGN KEY (id_serviciu) REFERENCES serviciu(id_serviciu) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS activitate (
    id_activitate INT AUTO_INCREMENT PRIMARY KEY,
    tip_activitate VARCHAR(50) NOT NULL,
    ora_inceput DATETIME NOT NULL,
    ora_final DATETIME  CHECK (ora_final IS NULL OR ora_final >= ora_inceput),
    status ENUM('planificata', 'in_curs', 'finalizata', 'anulata') DEFAULT 'planificata',
    creat_la TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    finalizat_la DATETIME NULL,
    observatii TEXT,
    id_cazare INT NULL,
    FOREIGN KEY (id_cazare) REFERENCES cazare(id_cazare) ON DELETE CASCADE,
    id_angajat INT,
    FOREIGN KEY (id_angajat) REFERENCES angajat(id_angajat) ON DELETE SET NULL,
    id_creat_de INT,
    FOREIGN KEY (id_creat_de)
        REFERENCES utilizator(id_utilizator)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS plata (
    id_plata INT AUTO_INCREMENT PRIMARY KEY,
    suma DECIMAL(10,2) NOT NULL CHECK (suma > 0),
    metoda ENUM('card', 'numerar', 'transfer') NOT NULL,
    data_platii DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('initiata', 'confirmata', 'esuata', 'rambursata') DEFAULT 'initiata',
    id_rezervare INT NOT NULL,
    FOREIGN KEY (id_rezervare) REFERENCES rezervare(id_rezervare) ON DELETE RESTRICT
);