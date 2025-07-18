DROP TABLE if exists notes.notes;
DROP TABLE if exists notes.users;
DROP TABLE if exists notes.captcha;

CREATE TABLE notes.notes (
	user_id int8 NOT NULL,
	id int8 NOT NULL,
	"content" text NULL,
	"position" json NULL,
	"size" json NULL,
	color varchar(64) NULL,
	fontsize float4 NULL,
	zindex int,
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
	CONSTRAINT users_id_pk PRIMARY KEY (id),
	CONSTRAINT users_username_uk UNIQUE (email)
);

CREATE TABLE notes.captcha (
	id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
	val varchar(10) NULL,
	expiration timestamp NULL,
	CONSTRAINT captcha_id_pk PRIMARY KEY (id)
);

select * from notes.users order by id desc;
select * from notes.notes order by id desc;
select * from notes.captcha order by id desc;


insert into notes.notes (id, user_id, content, position, size, color, fontsize, zindex)
select (select max(id) from notes.notes WHERE user_id = 1) + row_number() over (), user_id, content, json_build_object('x', trunc(random() * 40) * 25::int8, 'y', trunc(random() * 40) * 25::int8), size, color, fontsize, zindex
from notes.notes where user_id = 1;
