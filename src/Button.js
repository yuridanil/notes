import './Button.css';
import { useState } from 'react';

function Button({ icon, onClick }) {
    let strokeWidth;
    let pathData;
    switch (icon) {
        case 'drop':
            strokeWidth = 16;
            pathData = "M8 8 l48 48 M56 8 l-48 48";
            break;
        case 'incfont':
            strokeWidth = 16;
            pathData = "M32 8 l0 48 M8 32 l48 0";
            break;
        case 'decfont':
            strokeWidth = 16;
            pathData = "M8 32 l48 0";
            break;
        default:
            pathData = "M32 32 l0 0";
            break;
    }
    return (
        <div className='svg-wrapper' onClick={onClick}>
            <svg className='svg-button' viewBox='0 0 64 64' xmlns="http://www.w3.org/2000/svg">
                <path stroke="#aaaaaa" strokeWidth={strokeWidth} strokeLinecap="round" d={pathData} />
            </svg>
        </div>
    )
}

export default Button;