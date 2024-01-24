// https://github.com/vercel/next.js/discussions/32231?sort=new?sort=new

import { useRouter } from 'next/router'
import React from 'react'

const errorMessage = 'Please ignore this error.'

const throwFakeErrorToFoolNextRouter = () => {
    // Throwing an actual error class trips the Next.JS 500 Page, this string literal does not.
    // eslint-disable-next-line no-throw-literal
    throw errorMessage
}

const rejectionHandler = (event: PromiseRejectionEvent) => {
    console.log('rejectionHandler')
    if (event.reason === errorMessage) {
        event.preventDefault()
    }
}
interface Props {
    shouldStopNavigation: boolean
    onNavigate: () => void
}

const useNavigationObserver = ({ shouldStopNavigation, onNavigate }: Props) => {
    const router = useRouter()
    const currentPath = router.asPath
    const nextPath = React.useRef('')
    const navigationConfirmed = React.useRef(false)

    const killRouterEvent = React.useCallback(() => {
        // console.log('killRouterEvent')
        router.events.emit('routeChangeError', '', '', { shallow: false })
        throwFakeErrorToFoolNextRouter()
    }, [router])

    React.useEffect(() => {
        // navigationConfirmed.current = false


        const nativeBrowserHandler = (event) => {
            // console.log('nativeBrowserHandler')
            if (shouldStopNavigation &&
                !navigationConfirmed.current) {

                event.preventDefault();
                //   onNavigate()
            }
            return false
        };

        const onRouteChange = (url: string) => {
            // console.log(window.history)
            // console.log('onRouteChange')
            if (currentPath !== url) {
                // if the user clicked on the browser back button then the url displayed in the browser gets incorrectly updated
                // This is needed to restore the correct url.
                // note: history.pushState does not trigger a page reload
                // window.history.pushState(null, '', router.basePath + currentPath)

                // console.log(router.basePath + currentPath)
            }

            if (
                shouldStopNavigation &&
                url !== currentPath &&
                !navigationConfirmed.current
            ) {
                // removing the basePath from the url as it will be added by the router
                window.history.forward()
                nextPath.current = url.replace(router.basePath, '')
                onNavigate()
                killRouterEvent()
            }
        }

        // const onbeforeHistoryChange = () => {
        //     console.log('onbeforeHistoryChange')
        // }

        // router.events.on("beforeHistoryChange", onbeforeHistoryChange)
        router.events.on('routeChangeStart', onRouteChange)
        window.addEventListener('unhandledrejection', rejectionHandler)
        window.addEventListener('beforeunload', nativeBrowserHandler)

        return () => {
            // router.events.off("beforeHistoryChange", onbeforeHistoryChange)
            router.events.off('routeChangeStart', onRouteChange)
            window.removeEventListener('unhandledrejection', rejectionHandler)
            window.removeEventListener('beforeunload', nativeBrowserHandler)
        }
    }, [
        currentPath,
        killRouterEvent,
        onNavigate,
        router.basePath,
        router.events,
        shouldStopNavigation,
    ])

    const confirmNavigation = () => {
        console.log('navigate')
        // window.history.back()
        navigationConfirmed.current = true
        router.push(nextPath.current)
    }

    return { confirmNavigation }
}

export { useNavigationObserver }