import './Notes.css';
import { Rnd } from 'react-rnd';
import { useState, useEffect, useRef } from 'react';
import * as Const from './Constants';
import { Lang } from './Lang';

function Notes() {
  const [notes, setNotes] = useState(JSON.parse(localStorage.getItem('notes') || '[]'));
  const [dragId, setDragId] = useState(-1);
  const [transparentId, setTransparentId] = useState(-1);
  const [dropId, setDropId] = useState(-1);
  const [status, setStatus] = useState(0);
  const [saved, setSaved] = useState(localStorage.getItem('saved') || true);
  const saveTimeout = useRef(null);
  const touchTimeout = useRef(null);
  const touchStartTime = useRef(null);

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    localStorage.setItem('saved', saved);
  }, [saved]);

  useEffect((e) => {
    localStorage.setItem('notes', JSON.stringify(notes));
    clearTimeout(saveTimeout.current);
    setStatus(1);
    saveTimeout.current = setTimeout(() => {
      saveNotes();
    }, Const.SAVE_TIMEOUT);
  }, [notes]);

  function loadNotes() {
    setStatus(2);
    if (localStorage.getItem('saved') === 'true') {
      fetch('http://localhost:5000/api/load', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: '{"user_id":1}'
      })
        .then(response => response.json())
        .then(data => {
          if (data.result === 'ok') {
            setNotes(data.items);
            setStatus(0);
          }
          else
            setStatus(3);
        })
        .catch(error => {
          setStatus(3);
        });
    } else {
      setNotes(JSON.parse(localStorage.getItem('notes')));
    }
  }

  function saveNotes() {
    // return;
    setStatus(2);
    fetch('http://localhost:5000/api/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: 1, notes: JSON.parse(localStorage.getItem('notes')) })
    })
      .then(response => response.json())
      .then(data => {
        if (data.result === 'ok') {
          setStatus(0);
          setSaved(true);
        }
        else {
          setStatus(3);
        }
      })
      .catch(error => {
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
      "size": { "width": Const.GRID_SIZE * Const.DEFAULT_NOTE_WIDTH_SCALE, "height": Const.GRID_SIZE * Const.DEFAULT_NOTE_HEIGHT_SCALE },
      "color": Const.COLORS[colorIndex],
      "content": "",
      "fontsize": Const.DEFAULT_FONT_SIZE
    }]);
  }

  function dropNote(id) {
    setNotes(notes.filter(e => e.id !== id));
    setDropId(-1);
  }

  function beforeDropNote(id) {
    setTopId(id);
    setDropId(id);
  }

  function setTopId(id) {
    let itemZindex = notes.find(e => e.id === id).zindex;
    setNotes(notes.map((e) => {
      if (e.id === id)
        e.zindex = notes.length - 1;
      else if (e.zindex > itemZindex)
        e.zindex = e.zindex - 1;
      return e;
    }));
  }

  function moveStart(id) {
    setTopId(id);
    setDragId(id);
  };

  function move(x, y, w, h) {
    if (dragId !== -1) {
      setTransparentId(dragId);
      setNotes(notes.map((item) => {
        if (item.id === dragId) {
          item.position = { x: Math.max(x, 0), y: Math.max(y, 0) };
          item.size = { width: parseInt(w || item.size.width), height: parseInt(h || item.size.height) };
        }
        return item;
      }));
      setSaved(false);
    }
  }

  function moveStop() {
    setDragId(-1);
    setTransparentId(-1);
  };

  const handleTextareaChange = (id, newContent) => {
    setNotes(notes.map(item => item.id === id ? { ...item, content: newContent } : item));
    setSaved(false);
  };

  function incFontClick(id) {
    setNotes(notes.map(item => item.id === id ? { ...item, fontsize: Math.min(item.fontsize + Const.FONT_SIZE_STEP, Const.MAX_FONT_SIZE) } : item));
    setSaved(false);
  }

  function decFontClick(id) {
    setNotes(notes.map(item => item.id === id ? { ...item, fontsize: Math.max(item.fontsize - Const.FONT_SIZE_STEP, Const.MIN_FONT_SIZE) } : item));
    setSaved(false);
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
      {notes.map((e, i) => {
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
          size={e.size}
          dragGrid={[Const.GRID_SIZE, Const.GRID_SIZE]}
          resizeGrid={[Const.GRID_SIZE, Const.GRID_SIZE]}
          minWidth={Const.GRID_SIZE * 5}
          minHeight={Const.GRID_SIZE * 5}
          resizeHandleClasses={{ left: "horizHandleClass", right: "horizHandleClass", top: "vertHandleClass", bottom: "vertHandleClass" }}
        >
          <div className='toolbar'
            onMouseDown={e => { e.stopPropagation(); }}
            onTouchStart={e => { e.stopPropagation(); }}>
            <div className="tool-button icon-minus" onClick={() => decFontClick(e.id)} onTouchStart={() => decFontClick(e.id)} />
            <div className="tool-button icon-plus" onClick={() => incFontClick(e.id)} onTouchStart={() => incFontClick(e.id)} />
            <div className="tool-button icon-close" onClick={() => beforeDropNote(e.id)} onTouchStart={() => beforeDropNote(e.id)} />
          </div>
          <textarea className='note-text'
            autoFocus={e.zindex === notes.length - 1}
            id={e.id}
            key={e.id}
            value={e.content}
            onChange={(event) => handleTextareaChange(e.id, event.target.value)}
            onScroll={() => setDragId(-1)}
            style={{ backgroundColor: e.color, borderColor: e.color, fontSize: (e.fontsize || 1.2) + "pt" }}
            placeholder={Lang.placeholder}
          >
          </textarea>
          {e.id === dropId &&
            <div className='dialog'>
              <div className='dialog-button' onMouseDown={e => e.stopPropagation()} onClick={() => dropNote(e.id)} onTouchStart={() => dropNote(e.id)}>{Lang.delete}</div>
              <div className='dialog-button' onMouseDown={e => e.stopPropagation()} onClick={() => setDropId(-1)} onTouchStart={() => setDropId(-1)}>{Lang.cancel}</div>
            </div>
          }
        </Rnd>
      })}
      {<div className='status' style={{ color: status === 3 ? 'red' : 'gray' }}>{status === 0 && ""}{status === 1 && "•"}{[2, 3].includes(status) && "⬤"}</div>}
      <div className='copyright'>Notes © 2025 Yuri Danilov</div>
    </div>
  );

}

export default Notes;
