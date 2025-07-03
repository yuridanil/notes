import './Notes.css';
import { Rnd } from 'react-rnd';
import { useState, useEffect, useRef } from 'react';
import { COLORS } from './Constants';
import Button from './Button';

const GRID_SIZE = 50;
const SAVE_TIMEOUT = 100;

function Notes() {
  const [notes, setNotes] = useState([]);
  const [dragId, setDragId] = useState(-1);
  const [status, setStatus] = useState(0);
  const saveTimeout = useRef();

  function loadNotes() {
    setStatus(2);
    if (JSON.parse(localStorage.getItem('saved')) === true) {
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
      colorIndex = COLORS.indexOf(notes.at(-1).color) + 1;
      if (colorIndex >= COLORS.length)
        colorIndex = 0;
    } else {
      id = 0;
      colorIndex = 0;
    }
    setNotes([...notes, {
      "id": id,
      "zindex": notes.length,
      "position": {
        "x": Math.trunc(((e._reactName === 'onDoubleClick' ? e.clientX : e.changedTouches[0].clientX) + e.target.scrollLeft) / GRID_SIZE) * GRID_SIZE,
        "y": Math.trunc(((e._reactName === 'onDoubleClick' ? e.clientY : e.changedTouches[0].clientY) + e.target.scrollTop) / GRID_SIZE) * GRID_SIZE
      },
      "size": { "width": GRID_SIZE * 6, "height": GRID_SIZE * 6 },
      "color": COLORS[colorIndex],
      "content": "",
      "fontsize": 0.5
    }]);
  }

  function setTopId(id) {
    let itemZindex = notes.find(e => e.id === id).zindex;
    console.log(itemZindex);
    let newNotes = structuredClone(notes);
    newNotes = newNotes.map((e) => {
      if (e.id === id)
        e.zindex = notes.length - 1;
      else if (e.zindex > itemZindex)
        e.zindex = e.zindex - 1;
      return e;
    });
    setNotes(newNotes);
  }

  function dropNote(e) {
    let id = parseInt(e.target.closest('.note').id);
    setNotes(prevNotes =>
      prevNotes.filter(e => e.id !== id)
    );
  }

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect((e) => {
    localStorage.setItem('notes', JSON.stringify(notes));
    clearTimeout(saveTimeout.current);
    setStatus(1);
    saveTimeout.current = setTimeout(() => {
      saveNotes();
    }, SAVE_TIMEOUT);
  }, [notes]);

  function dragStart(e, d) {
    let id = parseInt(e.target.closest('.note').id);
    setTopId(id);
    setDragId(id);
  }

  function dragStop(e, d) {
    if (dragId !== -1) {
      let newNotes = structuredClone(notes);
      newNotes.map((item) => {
        if (item.id === dragId)
          item.position = { x: Math.max(d.x, 0), y: Math.max(d.y, 0) };
        return item;
      })
      setNotes(newNotes);
      setDragId(-1);
    }
  }

  function resizeStart(e, direction, ref, delta, position) {
    let id = parseInt(e.target.closest('.note').id);
    setTopId(id);
    setDragId(id);
  }

  function resizeStop(e, direction, ref, delta, position) {
    if (dragId !== -1) {
      setNotes(prevNotes =>
        prevNotes.map((item) => {
          if (item.id === dragId)
            item.size = { width: parseInt(ref.style.width), height: parseInt(ref.style.height) };
          return item;
        })
      );
      setDragId(-1);
    }
  }

  const handleTextareaChange = (id, newContent) => {
    setNotes(prevPanels =>
      prevPanels.map(item =>
        item.id === id ? { ...item, content: newContent } : item
      )
    );
  };

  function incFontClick(e) {
    setNotes(prevNotes =>
      prevNotes.map(item => {
        return item.id === parseInt(e.target.closest('.note').id) ? { ...item, fontsize: Math.round(Math.min(item.fontsize + 0.1, 3.5) * 10) / 10 } : item;
      })
    );
  }

  function decFontClick(e) {
    setNotes(prevNotes =>
      prevNotes.map(item => {
        return item.id === parseInt(e.target.closest('.note').id) ? { ...item, fontsize: Math.round(Math.max(item.fontsize - 0.1, 0.5) * 10) / 10 } : item;
      })
    );
  }

  return (
    <div className="notes"
      onDoubleClick={e => {
        addNote(e);
      }}
    // onTouchEnd={e => addNote(e)}
    >
      {notes.map((e, i) => {
        let newStyle = {
          zIndex: e.zindex,
          opacity: dragId === e.id ? 0.8 : 1,
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
          enableResizing={{ top: false, right: true, bottom: true, left: false, topRight: false, bottomRight: true, bottomLeft: false, topLeft: false }}
          onDragStart={(e, d) => { dragStart(e, d) }}
          onDragStop={(e, d) => { dragStop(e, d) }}
          onDoubleClick={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
          onResizeStart={(e, direction, ref, delta, position) => { resizeStart(e, direction, ref, delta, position) }}
          onResizeStop={(e, direction, ref, delta, position) => { resizeStop(e, direction, ref, delta, position) }}
          position={e.position}
          size={e.size}
          dragGrid={[GRID_SIZE, GRID_SIZE]}
          resizeGrid={[GRID_SIZE, GRID_SIZE]}
          minWidth={GRID_SIZE * 3}
          minHeight={GRID_SIZE * 2}
          resizeHandleClasses={{ right: "rightHandleClass", bottom: "bottomHandleClass" }}
        >
          <div className='toolbar'
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <Button icon='decfont' onClick={e => decFontClick(e)} />
            <Button icon='incfont' onClick={e => incFontClick(e)} />
            <Button icon='drop' onClick={e => dropNote(e)} />
          </div>
          <textarea className='note-text'
            autoFocus={e.zindex === notes.length - 1}
            id={e.id}
            key={e.id}
            value={e.content}
            onChange={(event) => handleTextareaChange(e.id, event.target.value)}
            onScroll={() => setDragId(-1)}
            style={{ backgroundColor: e.color, borderColor: e.color, fontSize: (e.fontsize || 1.2) + "em" }}
            placeholder="Place your text here..."
          >
          </textarea>
          <p style={{ zIndex: 10000 }}>{e.id}</p>
        </Rnd>
      })}
      {<div className='status'>{status === 0 && ""}{status === 1 && "•"}{status === 2 && "○"}{status === 3 && "e"}</div>}
      <div className='notes-copyright'>Notes © 2025 Yuri Danilov</div>
    </div>
  );

}

export default Notes;
