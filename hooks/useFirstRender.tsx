import React from "react";

export const useFirstRender = (callback) => {
    const [didLoad, setDidLoad] = React.useState<boolean>(false);

    React.useEffect(() => {
        if (!didLoad) {
            callback();
            setDidLoad(true);
        }
    }, [didLoad]);
}