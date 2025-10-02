import './Auth.css';
import './Constants.css';
import { EMAIL_REGEX } from './Constants.js';
import { Lang } from './Lang';
import { useState, useEffect, useRef } from 'react';

function Auth({ session_id, setSessionId, notes, setNotes, loadNotes, setSaved }) {
    const [showForm, setShowForm] = useState(false);
    const [inputEmail, setInputEmail] = useState(localStorage.getItem("email") || "");
    const [inputPassword, setInputPassword] = useState("");
    const [inputCaptcha, setInputCaptcha] = useState("");
    const [message, setMessage] = useState(null);
    const [showRequest, setShowRequest] = useState(false);
    const [showCaptchaRequest, setShowCaptchaRequest] = useState(false);
    const [image, setImage] = useState();
    const captchaTimeout = useRef(null);
    const [captchaId, setCaptchaId] = useState(null);
    const [captchaTime, setCaptchaTime] = useState(null);

    useEffect(() => {
        setMessage("");
    }, [inputEmail, inputPassword]);

    useEffect(() => {
        if (showForm) {
            captchaTimeout.current = setTimeout(() => {
                if (Date.now() - captchaTime > 60000)
                    loadCaptcha();
            }, 1000);
        } else {
            clearTimeout(captchaTimeout.current);
        }
    }, [showForm]);

    function loadCaptcha() {
        setImage("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'></svg>");
        setShowCaptchaRequest(true);
        fetch('api/captcha', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.json())
            .then(data => {
                setShowCaptchaRequest(false);
                if (data.message === 'ok') {
                    setImage(data.image);
                    setCaptchaId(data.id);
                    setInputCaptcha("");
                    setCaptchaTime(Date.now());
                } else {
                    setMessage(Lang[data.message]);
                }
            })
            .catch(error => {
                setShowCaptchaRequest(false);
            });
    }

    function login(mode, user, pass) {
        // console.log('{login}' + mode);
        if (!EMAIL_REGEX.test(inputEmail)) { // check email format
            setMessage(Lang['wrongemail']);
        } else if (inputPassword.length < 6) { // check pass length
            setMessage(Lang['shortpassword']);
        } else {
            setMessage("");
            setShowRequest(true);
            fetch('api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ mode: mode, email: user, password: pass, captcha_id: captchaId, captcha_value: inputCaptcha.trim(), notes: mode === 'signup' ? notes : [] })
            })
                .then(response => response.json())
                .then(data => {
                    setShowRequest(false);
                    if (data.message === 'ok') {
                        localStorage.setItem("email", inputEmail);
                        setSessionId(data.session_id);
                        if (mode === 'signin')
                            loadNotes(data.session_id);
                        else if (mode === 'signup')
                            setSaved(true);
                    } else {
                        setMessage(Lang[data.message]);
                    }
                })
                .catch(error => {
                    // console.log('error');
                    setShowRequest(false);
                    // console.log(error);
                });
        }
    }

    function logout() {
        setShowForm(false);
        setCaptchaTime(null);
        setSessionId("");
        setNotes([]);
    }


    function handleCloseClick(e) {
        e.stopPropagation();
        setShowForm(false);
    }

    function handleAuthClick(e) {
        e.stopPropagation();
        setShowForm(true);
    }

    function handleLogoutClick(e) {
        e.stopPropagation();
        logout();
    }

    function handleTouchFocus(e) {
        e.stopPropagation();
        e.target.focus();
    }

    function handleSignInClick(e) {
        console.log(e);
        e.stopPropagation();
        login('signin', inputEmail, inputPassword);
    }

    function handleSignUpClick(e) {
        console.log(e);
        e.stopPropagation();
        login('signup', inputEmail, inputPassword)
    }

    return (
        <div className='auth' onDoubleClick={e => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
            {session_id === "" ?
                <>
                    <form className='auth-form' style={{ display: showForm ? 'flex' : 'none' }}>
                        <div className='form-header'><div className='pointer'
                            onClick={handleCloseClick}
                            onTouchStart={handleCloseClick}
                        >{Lang.x}</div></div>
                        {showRequest &&
                            <div className='spinner-wrapper'>
                                <div className="spinner icon-spinner s24" />
                            </div>
                        }
                        <input name="email" className='form-input' type='text' placeholder={Lang.email} autoComplete='off' value={inputEmail}
                            onTouchStart={handleTouchFocus}
                            onChange={e => setInputEmail(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") document.querySelector('input[name="password"]').focus(); }}
                        />
                        <input name="password" className='form-input' type='password' placeholder={Lang.password} autoComplete='off' value={inputPassword}
                            onTouchStart={handleTouchFocus}
                            onChange={e => setInputPassword(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") document.querySelector('input[name="captcha"]').focus(); }}
                        />
                        <div className='flexrow'>
                            <img alt='' className='captcha' src={image} />
                            {showCaptchaRequest ? <div className="spinner icon-spinner s24" /> : <div className="reload pointer icon-reload" onClick={loadCaptcha} onTouchStart={loadCaptcha}/>}
                            <input name="captcha" className='captcha-input' type='text' value={inputCaptcha}
                                onTouchStart={handleTouchFocus}
                                onChange={e => setInputCaptcha(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") login('signin', inputEmail, inputPassword); }}
                            />
                        </div>
                        <div className='flexrow'>
                            <div className='pointer' onClick={handleSignInClick} onTouchStart={handleSignInClick}>{Lang.signin}</div>
                            <div className='pointer' onClick={handleSignUpClick} onTouchStart={handleSignUpClick}>{Lang.signup}</div>
                        </div>
                        {message && <div className='red'>{message}</div>}
                    </form>
                    <div className="auth-bar" style={{ display: !showForm ? 'flex' : 'none' }}>
                        <span className='gray'>{Lang.authhint},&nbsp;</span>
                        <span className='black pointer'
                            onClick={handleAuthClick}
                            onTouchStart={handleAuthClick}
                        >{Lang.authorize}</span>
                    </div>
                </>
                :
                <div className="auth-bar"><span className='gray'>{inputEmail}&nbsp;</span><span className='black pointer' onClick={handleLogoutClick} onTouchStart={handleLogoutClick}>{Lang.signout}</span></div>
            }
        </div >
    );
}

export default Auth;