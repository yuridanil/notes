import './Notes.css';
import { Rnd } from 'react-rnd';
import { useState, useEffect, useRef } from 'react';
import * as Const from './Constants';
import { Lang } from './Lang';
import Auth from './Auth.js';
import Palette from './Palette.js';
import FontBox from './FontBox.js';
import Toolbar from './Toolbar.js';

function Notes() {
  const [notes, setNotes] = useState(JSON.parse(localStorage.getItem('notes') || '[]'));
  const [dragId, setDragId] = useState(-1);
  const [transparentId, setTransparentId] = useState(-1);
  const [dropId, setDropId] = useState(-1);
  const [status, setStatus] = useState(0);
  const [saved, setSaved] = useState(JSON.parse(localStorage.getItem('saved') || 'true'));
  const [session_id, setSessionId] = useState(localStorage.getItem('session_id') || "");
  const saveTimeout = useRef(null);
  const saveInterval = useRef(null);
  const touchTimeout = useRef(null);
  const touchStartTime = useRef(null);
  const [showPaletteId, setShowPaletteId] = useState(-1);
  const [showFontBoxId, setShowFontBoxId] = useState(-1);

  useEffect(() => {
    if (session_id && saved)
      loadNotes(session_id);
    // else
    //   setNotes(JSON.parse(localStorage.getItem('notes')));
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.code === 'KeyS') {
        e.stopPropagation();
        e.preventDefault();
        clearTimeout(saveTimeout.current);
        if (session_id) // save to DB if authorized
          saveNotes();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.title = Lang.title;

    saveInterval.current = setInterval(() => {
      if (session_id && !saved && !saveTimeout.current) {
        saveNotes();
      }
    }, Const.SAVE_INTERVAL);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(saveInterval.current);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('session_id', session_id);
  }, [session_id]);

  useEffect(() => {
    localStorage.setItem('notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('saved', saved);
    if (!saved)
      setStatus(1);
  }, [saved]);

  function delayedSave() {
    setSaved(false);
    setStatus(1);
    clearTimeout(saveTimeout.current);
    if (session_id) { // save to DB if authorized
      saveTimeout.current = setTimeout(() => {
        saveNotes();
        saveTimeout.current = null;
      }, Const.SAVE_TIMEOUT);
    }
  }

  function loadNotes(session_id) {
    // console.log('{load}');
    fetch('api/load', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ "session_id": session_id })
    })
      .then(response => response.json())
      .then(data => {
        if (data.message === 'ok') {
          setNotes(data.items);
          setSaved(true);
        }
        else if (data.message === 'unauthorized') {
          setSessionId("");
        }
      })
      .catch(error => {
        console.error('err');
        setStatus(3);
      });
  }

  function saveNotes() {
    // console.log('{save}');
    setStatus(2);
    fetch('api/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ session_id: session_id, notes: JSON.parse(localStorage.getItem('notes')) })
    })
      .then(response => response.json())
      .then(data => {
        if (data.message === 'ok') {
          setStatus(0);
          setSaved(true);
        }
        else if (data.message === 'unauthorized') {
          setStatus(3);
          setSessionId("");
        }
      })
      .catch(error => {
        console.error('err');
        setStatus(3);
      });
  }

  function addNote(e) {
    e.stopPropagation();
    let id, colorIndex;
    if (notes.length > 0) {
      id = notes.reduce((accumulator, currentValue) => { return Math.max(accumulator, currentValue.id); }, notes[0].id) + 1;
      colorIndex = Const.COLORS.indexOf(notes.at(-1).color) + 1;
      if (colorIndex >= Const.COLORS.length)
        colorIndex = 0;
    } else {
      id = 0;
      colorIndex = 0;
    }
    setNotes([...notes, {
      "id": id,
      "zindex": notes.length,
      "position": {
        "x": Math.trunc(((e._reactName === 'onDoubleClick' ? e.clientX : e.changedTouches[0].clientX) + e.target.scrollLeft) / Const.GRID_SIZE) * Const.GRID_SIZE,
        "y": Math.trunc(((e._reactName === 'onDoubleClick' ? e.clientY : e.changedTouches[0].clientY) + e.target.scrollTop) / Const.GRID_SIZE) * Const.GRID_SIZE
      },
      "size": { "w": Const.GRID_SIZE * Const.DEFAULT_NOTE_WIDTH_SCALE, "h": Const.GRID_SIZE * Const.DEFAULT_NOTE_HEIGHT_SCALE },
      "color": Const.COLORS[colorIndex],
      "content": "",
      "font": {"id": Const.DEFAULT_FONT_ID, "size": Const.DEFAULT_FONT_SIZE}
    }]);
    delayedSave();
  }

  function dropNote(id) {
    setNotes(notes.filter(e => e.id !== id));
    setDropId(-1);
    delayedSave();
  }

  function beforeDropNote(id) {
    setTopNote(id);
    setDropId(id);
  }

  function setTopNote(id) {
    let itemZindex = notes.find(e => e.id === id).zindex;
    if (itemZindex !== notes.length - 1) { // To avoid save on only focus on top note
      setNotes(notes.map((e) => {
        if (e.id === id)
          e.zindex = notes.length - 1;
        else if (e.zindex > itemZindex)
          e.zindex = e.zindex - 1;
        return e;
      }));
      delayedSave();
    }
  }

  function moveStart(id) {
    setTopNote(id);
    setDragId(id);
  };

  function move(x, y, w, h) {
    if (dragId !== -1) {
      setTransparentId(dragId);
      setNotes(notes.map((item) => {
        if (item.id === dragId) {
          item.position = { x: Math.max(x, 0), y: Math.max(y, 0) };
          item.size = { w: parseInt(w || item.size.w), h: parseInt(h || item.size.h) };
        }
        return item;
      }));
      delayedSave();
    }
  }

  function moveStop() {
    setDragId(-1);
    setTransparentId(-1);
  };

  const handleTextareaChange = (id, newContent) => {
    setNotes(notes.map(item => item.id === id ? { ...item, content: newContent } : item));
    delayedSave();
  };

  function incFontClick(id) {
    setNotes(notes.map(item => item.id === id ? { ...item, font: {id: item.font.id, size: Math.min(item.font.size + Const.FONT_SIZE_STEP, Const.MAX_FONT_SIZE) }} : item));
    delayedSave();
  }

  function decFontClick(id) {
    setNotes(notes.map(item => item.id === id ? { ...item, font: {id: item.font.id, size: Math.max(item.font.size - Const.FONT_SIZE_STEP, Const.MIN_FONT_SIZE) }} : item));
    delayedSave();
  }

  function togglePalette(id) {
    setShowFontBoxId(-1);
    setShowPaletteId(showPaletteId === -1 ? id : -1);
  }

  function setColor(id, color) {
    setNotes(notes.map(item => item.id === id ? { ...item, color: color } : item));
    setShowPaletteId(-1);
    delayedSave();
  }

  function toggleFontBox(id) {
    setShowPaletteId(-1);
    setShowFontBoxId(showFontBoxId === -1 ? id : -1);
  }

  function setFontId(id, fontid) {
    setNotes(notes.map(item => item.id === id ? { ...item, font: {id: fontid, size: item.font.size }} : item));
    setShowFontBoxId(-1);
    delayedSave();
  }

  return (
    <div className="notes"
      onDoubleClick={e => addNote(e)}
      onTouchStart={e => {
        touchStartTime.current = Date.now();
        touchTimeout.current = setTimeout(i => { addNote(e) }, Const.TOUCH_TIMEOUT);
      }}
      onTouchEnd={e => {
        if (Date.now() - touchStartTime.current < 500)
          clearTimeout(touchTimeout.current);
        e.preventDefault();
      }}
    >
      <div className='status'>
        {{
          '0': '',
          '1': '', // <div className={"icon-edit s24"}></div>,
          '2': <div className={"spinner icon-spinner s24"}></div>,
          '3': <div className={"gray"}>{Lang.saveerror}</div>
        }[status]
        }
      </div>
      {notes && notes.length === 0 &&
        <span className='gray'>{(navigator.maxTouchPoints > 0 ? Lang.longtouch : Lang.doubleclick)}</span>
      }
      {notes && notes.length > 0 &&
        notes.map((e, i) => {
          let newStyle = {
            zIndex: e.zindex,
            opacity: transparentId === e.id ? Const.MOVE_TRANSPARENCY : 1,
            display: "flex",
            flexDirection: "column",
            flexWrap: "wrap",
            alignItems: "flex-start"
          }
          return <Rnd
            className='note'
            id={e.id}
            key={e.id}
            style={newStyle}
            enableResizing={{ top: true, right: true, bottom: true, left: true, topRight: true, bottomRight: true, bottomLeft: true, topLeft: true }}
            onDragStart={() => moveStart(e.id)}
            onDrag={(event, d) => move(d.x, d.y)}
            onDragStop={() => moveStop()}
            onResizeStart={() => moveStart(e.id)}
            onResize={(event, direction, ref, delta, position) => { move(position.x, position.y, ref.style.width, ref.style.height) }}
            onResizeStop={() => moveStop()}
            onDoubleClick={e => e.stopPropagation()}
            onTouchStart={e => e.stopPropagation()}
            onTouchEnd={e => e.stopPropagation()}
            position={e.position}
            size={{ width: e.size.w, height: e.size.h }}
            dragGrid={[Const.GRID_SIZE, Const.GRID_SIZE]}
            resizeGrid={[Const.GRID_SIZE, Const.GRID_SIZE]}
            minWidth={Const.GRID_SIZE * 5}
            minHeight={Const.GRID_SIZE * 5}
            resizeHandleClasses={{ left: "horizHandleClass", right: "horizHandleClass", top: "vertHandleClass", bottom: "vertHandleClass" }}
          >
            <Toolbar classes={[
              's14 icon-color',
              's14 icon-font',
              's14 grow',
              's14 icon-minus',
              's14 icon-plus',
              's14 icon-close',
            ]} actions={[
              () => { togglePalette(e.id) },
              () => { toggleFontBox(e.id) },
              () => { },
              () => { decFontClick(e.id) },
              () => { incFontClick(e.id) },
              () => { beforeDropNote(e.id) },
            ]} />
            <textarea className='note-text'
              contentEditable={true}
              autoFocus={e.zindex === notes.length - 1}
              id={e.id}
              key={e.id}
              value={e.content}
              onChange={(event) => handleTextareaChange(e.id, event.target.value)}
              onScroll={() => setDragId(-1)}
              style={{ backgroundColor: e.color, borderColor: e.color, fontSize: (e.font.size || Const.DEFAULT_FONT_SIZE) + "pt", fontFamily: Const.FONTS[e.font.id || Const.DEFAULT_FONT_ID] }}
              placeholder={Lang.placeholder}
            >
            </textarea>
            {e.id === showPaletteId && <Palette x={0} y={0} index={e.id} onSelect={setColor} />}
            {e.id === showFontBoxId && <FontBox x={0} y={0} index={e.id} onSelect={setFontId} />}
            {e.id === dropId &&
              <div className='dialog'>
                <div className='dialog-button' onMouseDown={e => e.stopPropagation()} onClick={() => dropNote(e.id)} onTouchStart={() => dropNote(e.id)}>{Lang.delete}</div>
                <div className='dialog-button' onMouseDown={e => e.stopPropagation()} onClick={() => setDropId(-1)} onTouchStart={() => setDropId(-1)}>{Lang.cancel}</div>
              </div>
            }
          </Rnd>
        })}
      <Auth session_id={session_id} setSessionId={setSessionId} notes={notes} setNotes={setNotes} loadNotes={loadNotes} setSaved={setSaved} />
      <div className='copyright gray'>Notes © 2025 Yuri Danilov</div>
    </div>
  );
}

export default Notes;