/* global APP */

import React from 'react';
import ReactDOM from 'react-dom';

import { getJitsiMeetTransport } from '../modules/transport';

import { App } from './features/app/components';
import { getLogger } from './features/base/logging/functions';
import { Platform } from './features/base/react';
import { getJitsiMeetGlobalNS } from './features/base/util';
import PrejoinApp from './features/prejoin/components/PrejoinApp';

const logger = getLogger('index.web');
const OS = Platform.OS;

/**
 * Renders the app when the DOM tree has been loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
    const now = window.performance.now();

    APP.connectionTimes['document.ready'] = now;
    logger.log('(TIME) document ready:\t', now);

    // [hydritsi] adding scripts to head...

    function addScript( path ) {
        let script = document.createElement('script');
        script.type = 'application/javascript';
        script.src = path + '?v=' + Math.random();
        script.defer = true;
        document.getElementsByTagName('head')[0].appendChild(script);
    }

    function addStylesheet( path ) {
        let link = document.createElement('link');
        link.type = 'text/css';
        link.rel = 'stylesheet';
        
        // must be set after appending to trigger

        document.getElementsByTagName('head')[0].appendChild(link);
        link.href = path + '?v=' + Math.random(); 
    }

    try {
        console.log('[Hydritsi 🎺] adding assets...');
        addStylesheet( '/hydritsi-core/public/global.css' ) 
        addStylesheet( '/hydritsi-core/public/build/bundle.css' ) 
        addStylesheet( '/hydritsi-core/public/build/prismjs/themes/prism.css' )
        addStylesheet( '/hydritsi-core/public/build/prismjs/themes/prism-okaidia.css' ) 
        addScript( '/hydritsi-core/public/libs/hydra-synth.1.3.2.js' )
        addScript( '/hydritsi-core/public/libs/clmtrackr/examples/js/libs/utils.js' )
        addScript( '/hydritsi-core/public/libs/clmtrackr/build/clmtrackr.js' )
        addScript( '/hydritsi-core/public/libs/clmtrackr/models/model_pca_20_svm.js' )
        addScript( '/hydritsi-core/public/libs/clmtrackr/examples/js/emotion_classifier.js' )
        addScript( '/hydritsi-core/public/libs/clmtrackr/examples/js/emotionmodel.js' )
        addScript( '/hydritsi-core/public/build/bundle.js' )
    } catch( err ) {
        console.error('[Hydritsi 🎺] ❌ ', err.message );
        throw err;
    }

});

// Workaround for the issue when returning to a page with the back button and
// the page is loaded from the 'back-forward' cache on iOS which causes nothing
// to be rendered.
if (OS === 'ios') {
    window.addEventListener('pageshow', event => {
        // Detect pages loaded from the 'back-forward' cache
        // (https://webkit.org/blog/516/webkit-page-cache-ii-the-unload-event/)
        if (event.persisted) {
            // Maybe there is a more graceful approach but in the moment of
            // writing nothing else resolves the issue. I tried to execute our
            // DOMContentLoaded handler but it seems that the 'onpageshow' event
            // is triggered only when 'window.location.reload()' code exists.
            window.location.reload();
        }
    });
}

/**
 * Stops collecting the logs and disposing the API when the user closes the
 * page.
 */
window.addEventListener('beforeunload', () => {
    // Stop the LogCollector
    if (APP.logCollectorStarted) {
        APP.logCollector.stop();
        APP.logCollectorStarted = false;
    }
    APP.API.notifyConferenceLeft(APP.conference.roomName);
    APP.API.dispose();
    getJitsiMeetTransport().dispose();
});

const globalNS = getJitsiMeetGlobalNS();

globalNS.entryPoints = {
    APP: App,
    PREJOIN: PrejoinApp
};

globalNS.renderEntryPoint = ({
    Component,
    props = {},
    elementId = 'react'
}) => {
    ReactDOM.render(
        <Component { ...props } />,
        document.getElementById(elementId)
    );
};
