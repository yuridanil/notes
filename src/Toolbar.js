import './Toolbar.css';

function Toolbar({ classes, actions }) {
    return (
        <div className='toolbar'
            onMouseDown={e => { e.stopPropagation(); }}
            onTouchStart={e => { e.stopPropagation(); }}
        >
            {classes.map((e, i) => <div key={i} className={'tool-button ' + classes[i]} onClick={actions[i]} onTouchStart={actions[i]} />)}
        </div>
    );
}

export default Toolbar;