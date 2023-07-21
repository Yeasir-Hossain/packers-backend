import passport from 'passport';
import GoogleStrategy from 'passport-google-oauth2';

export default function (settings) {
  passport.use(new GoogleStrategy({
    clientID: settings.oauth.google.clientID,
    clientSecret: settings.oauth.google.clientSecret,
    callbackURL: settings.oauth.google.callbackURL,
    scope: ['email', 'profile']
  }, (accessToken, refreshToken, profile, done) => {
    console.log('profile', profile);
    return done(null, profile);
  }));

  passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
      return cb(null, user);
    });
  });

  passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
      return cb(null, user);
    });
  });
}
