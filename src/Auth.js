import './Auth.css';
import './Constants.css';
import { EMAIL_REGEX } from './Constants.js';
import { Lang } from './Lang';
import { useState, useEffect, useRef } from 'react';

function Auth({ session_id, setSessionId, notes, setNotes, loadNotes, setSaved }) {
    const [showForm, setShowForm] = useState(false);
    const [inputEmail, setInputEmail] = useState("a@a.a");
    const [inputPassword, setInputPassword] = useState("User123!");
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
        fetch('http://localhost:5000/api/captcha', {
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
        console.log('{login}' + mode);
        if (!EMAIL_REGEX.test(inputEmail)) { // check email format
            setMessage(Lang['wrongemail']);
        } else if (inputPassword.length < 6) { // check pass length
            setMessage(Lang['shortpassword']);
        } else {
            setMessage("");
            setShowRequest(true);
            fetch('http://localhost:5000/api/login', {
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
                    console.log(error);
                });

        }
    }

    function logout() {
        setShowForm(false);
        setCaptchaTime(null);
        setSessionId("");
        setNotes([]);
    }

    return (
        <div className='auth' onDoubleClick={e => e.stopPropagation()}>
            {session_id === "" ?
                <>
                    {
                        showForm ?
                            <form className='auth-form'>
                                <div className='form-header'><div className='pointer' onClick={() => setShowForm(false)}>{Lang.x}</div></div>
                                {showRequest &&
                                    <div className='spinner-wrapper'>
                                        <div className="spinner icon-spinner" />
                                    </div>
                                }
                                <input name="email" className='form-input' type='text' placeholder={Lang.email} autoComplete='off' value={inputEmail} onChange={e => setInputEmail(e.target.value)} />
                                <input name="password" className='form-input' type='password' placeholder={Lang.password} autoComplete='off' value={inputPassword} onChange={e => setInputPassword(e.target.value)} />
                                <div className='flexrow'>
                                    <img alt='' className='captcha' src={image} />
                                    {showCaptchaRequest ? <div className="spinner icon-spinner" /> : <div className="reload pointer icon-reload" onClick={e => loadCaptcha()} />}
                                    <input className='captcha-input' type='text' value={inputCaptcha} onChange={e => setInputCaptcha(e.target.value)} />
                                </div>
                                <div className='flexrow'>
                                    <div className='pointer' onClick={() => login('signin', inputEmail, inputPassword)}>{Lang.signin}</div>
                                    <div className='pointer' onClick={() => login('signup', inputEmail, inputPassword)}>{Lang.signup}</div>
                                </div>
                                {message && <div className='red'>{message}</div>}
                            </form>
                            :
                            <div className="auth-bar" >
                                <span className='gray'>{Lang.authhint},&nbsp;</span>
                                <span className='black pointer' onClick={() => { setShowForm(true); setMessage(""); }} onTouchStart={() => { setShowForm(true); setMessage(""); }}>{Lang.authorize}</span>
                            </div>
                    }
                </>
                :
                <div className="auth-bar"><span className='gray'>{inputEmail}&nbsp;</span><span className='black pointer' onClick={logout} onTouchStart={logout}>{Lang.signout}</span></div>
            }
        </div>
    );
}

export default Auth;