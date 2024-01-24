import React from 'react';

const isBrowser = !!((typeof window !== 'undefined' && window.document && window.document.createElement))

export function stringifyOptions(options) {
    return Object.keys(options).reduce((acc, key) => {
        if (key === 'days') {
            return acc;
        } else {
            if (options[key] === false) {
                return acc;
            } else if (options[key] === true) {
                return `${acc}; ${key}`;
            } else {
                return `${acc}; ${key}=${options[key]}`;
            }
        }
    }, '');
}

export function setCookie<T>(name: string, value: T, options) {
    if (!isBrowser) return;

    const optionsWithDefaults = {
        days: 3650,
        path: '/',
        ...options,
    };

    const expires = new Date(
        Date.now() + optionsWithDefaults.days * 864e5
    ).toUTCString();

    document.cookie =
        name +
        '=' +
        JSON.stringify(value) +
        '; expires=' +
        expires +
        stringifyOptions(optionsWithDefaults);
};

export function getCookie<T>(name: string, initialValue: T) {
    return (
        (isBrowser &&
            document.cookie.split('; ').reduce((r, v) => {
                const parts = v.split('=');
                return parts[0] === name ? JSON.parse(parts[1]) : r;
            }, '')) ||
        initialValue
    );
};

export default function <T>(name: string, initialValue: T): [T, React.Dispatch<T>, (value: T, options?: any | undefined) => void] {
    const [item, setItem] = React.useState(initialValue)
    // const [item, setItem] = React.useState(() => getCookie(name, initialValue))

    React.useEffect(() => setItem(getCookie(name, initialValue)), [setItem]);

    // console.log(`cookie[${name}]=${item}`)

    // const [item, setItem] = useState(() => {
    //     return getCookie(name, initialValue);
    // });

    return [item, setItem, (value: T, options?: any | undefined) => {
        setItem(value);
        setCookie(name, value, options);
    }];
}