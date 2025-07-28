import './FontBox.css';
import { FONTS } from './Constants.js';

function FontBox({ x, y, index, onSelect }) {
    return (
        <div className='fontbox'>
            {FONTS.map((e, i) =>
                <div
                    key={i}
                    className='fontbox-row'
                    onClick={() => onSelect(index, i)}
                    style={{fontFamily:e}}
                >{e.split(',')[0].replaceAll('"', '')}</div>
            )}
        </div>
    );
}

export default FontBox;