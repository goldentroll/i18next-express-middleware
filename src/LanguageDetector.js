import * as utils from './utils';
import cookieLookup from './languageLookups/cookie';
import querystringLookup from './languageLookups/querystring';
import pathLookup from './languageLookups/path';
import headerLookup from './languageLookups/header';

function getDefaults() {
  return {
    order: [/*'path',*/ 'querystring', 'cookie', 'header'],
    lookupQuerystring: 'lng',
    lookupCookie: 'i18next',
    lookupFromPathIndex: 0,

    // cache user language
    caches: false // ['cookie']
    //cookieExpirationDate: new Date(),
    //cookieDomain: 'myDomain'
  };
}

class LanguageDetector {
  constructor(services, options = {}) {
    this.type = 'languageDetector';
    this.detectors = {};

    this.init(services, options);
  }

  init(services, options = {}) {
    this.services = services;
    this.options = utils.defaults(options, this.options || {}, getDefaults());

    this.addDetector(cookieLookup);
    this.addDetector(querystringLookup);
    this.addDetector(pathLookup);
    this.addDetector(headerLookup);
  }

  addDetector(detector) {
    this.detectors[detector.name] = detector;
  }

  detect(req, res, detectionOrder) {
    if (!detectionOrder) detectionOrder = this.options.order;

    let detected = [];
    detectionOrder.forEach(detectorName => {
      if (this.detectors[detectorName]) {
        let lookup = this.detectors[detectorName].lookup(req, res, this.options);
        if (lookup && typeof lookup === 'string') lookup = [lookup];
        if (lookup) detected = detected.concat(lookup);
      }
    });

    let found;
    detected.forEach(lng => {
      if (found) return;
      let cleanedLng = this.services.languageUtils.formatLanguageCode(lng);
      if (this.services.languageUtils.isWhitelisted(cleanedLng)) found = cleanedLng;
    });

    return found || this.options.fallbackLng[0];
  }

  cacheUserLanguage(req, res, lng, caches) {
    if (!caches) caches = this.options.caches;
    caches.forEach(cacheName => {
      if (this.detectors[cacheName] && this.detectors[cacheName].cacheUserLanguage) this.detectors[cacheName].cacheUserLanguage(req, res, lng, this.options);
    });
  }
}

LanguageDetector.type = 'languageDetector';

export default LanguageDetector;
