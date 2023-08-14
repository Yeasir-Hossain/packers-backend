import GoogleStrategy from 'passport-google-oauth2';
import FacebookStrategy from 'passport-facebook';
import socialLogin from '../../utils/socialLogin';

export default function ({ settings, db, passport }) {
  passport.use(new GoogleStrategy({
    clientID: settings.oauth.google.clientID,
    clientSecret: settings.oauth.google.clientSecret,
    callbackURL: settings.oauth.google.callbackURL,
    scope: ['email', 'profile']
  }, async (accessToken, refreshToken, profile, done) => {
    const { id, name, picture, email } = profile._json;
    const user = await socialLogin(id, name, picture, email, db);
    if (!user) return done(null, false, { message: { message: 'Bad Request', status: false } });
    return done(null, user);
  }));

  passport.use(new FacebookStrategy({
    clientID: settings.oauth.facebook.appID,
    clientSecret: settings.oauth.facebook.appSecret,
    callbackURL: settings.oauth.facebook.callbackURL,
    profileFields: ['displayName', 'photos', 'email']
  }, async (accessToken, refreshToken, profile, done) => {
    const { id, displayName, photos, email } = profile;
    /**
     * email permissions in facebook developer is needed to access the email from facebook profile
     * @param email is now null
     */
    const user = await socialLogin(id, displayName, photos[0].value, email, db);
    if (!user) return done(null, false, { message: { message: 'Bad Request', status: false } });
    return done(null, user);
  }));

  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(async (user, done) => {
    done(null, user);
  });

}