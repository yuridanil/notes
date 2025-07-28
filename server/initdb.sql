	drop schema notes cascade;
	drop USER notes;

	CREATE USER notes WITH PASSWORD 'notes123';
	CREATE SCHEMA notes AUTHORIZATION notes;

	CREATE TABLE notes.notes (
		user_id int8 NOT NULL,
		id int8 NOT NULL,
		"content" text NULL,
		"position" json NULL,
		"size" json NULL,
		"font" json NULL,
		color varchar(64) NULL,
		zindex int,
		share_id varchar(255) DEFAULT gen_random_uuid(),
		CONSTRAINT notes_user_id_id_pk PRIMARY KEY (user_id, id)
	);

	CREATE TABLE notes.users (
		id int8 GENERATED ALWAYS AS IDENTITY NOT NULL,
		email varchar(256) NOT NULL,
		password varchar(255) not NULL,
		session_id varchar(255) null,
		registration timestamp,
		confirmation timestamp,
		expiration timestamp,
		confirmation_id varchar(255) null,
		confirmed smallint DEFAULT 0,
		failed int default 0,
		CONSTRAINT users_id_pk PRIMARY KEY (id),
		CONSTRAINT users_username_uk UNIQUE (email)
	);

	CREATE TABLE notes.captcha (
		id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
		val varchar(10) NULL,
		expiration timestamp NULL,
		CONSTRAINT captcha_id_pk PRIMARY KEY (id)
	);

	GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA notes TO notes;
	