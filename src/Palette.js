import './Palette.css';
import { COLORS } from './Constants.js';


function Palette({ x, y, index, onSelect }) {
    return (
        <div className='palette'>
            {COLORS.map((e, i) =>
                <div
                    key={i}
                    className='palette-cell'
                    style={{ backgroundColor: `${e}` }}
                    onClick={() => onSelect(index, COLORS[i])}
                />)}
        </div>
    );
}

export default Palette;