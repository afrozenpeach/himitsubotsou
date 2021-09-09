import express from 'express';
import { Config } from "../../config.js";
import joi from 'joi';
import jwt from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import jwtDecode from 'jwt-decode';

export default function createRouter(sql) {
    const router = express.Router();

    //Get all characters
    router.get('/', function (req, res, next) {
      let session;
      let result = [];
      let results = [];

      sql.getSession()
      .then(s => { session = s; return session.getSchema(Config.MYSQL_CHARDB) })
      .then(s => { return s.getTable("Characters") })
      .then(t =>
          t.select()
          .orderBy("name ASC")
          .execute(
              row => {
                  row.forEach((value, i) => {
                      result[i] = Object.assign({}, result[i], { value });
                  });

                  let resultCopy = [...result];
                  results.push(resultCopy);
              },
              columns => {
                  columns.forEach((key, i) => { result[i] = Object.assign({}, result[i], { key: key.getColumnName() }) });
              }
          )
          .catch(err => {
              res.status(500).json({status: err});
          }))
      .then(() => {
          let output = [];

          for (const r of results) {
              let character = r.reduce((res, pair) => Object.assign(res, { [pair.key]: pair.value }), {});
              output.push(character);
          }

          res.status(200).json(output);
          session.close();
      })
      .catch(e => {
          res.status(503).json("API Error");
      });
    });

    //get a specific character
    router.get('/:id', function (req, res, next) {
      let session;
      let result = [];

      sql.getSession()
      .then(s => { session = s; return session.getSchema(Config.MYSQL_CHARDB) })
      .then(s => { return s.getTable("Characters") })
      .then(t =>
          t.select()
          .where("id = :id")
          .bind("id", req.params.id)
          .execute(
              row => {
                  row.forEach((value, i) => { result[i] = Object.assign({}, result[i], { value }) });
              },
              columns => {
                  columns.forEach((key, i) => { result[i] = Object.assign({}, result[i], { key: key.getColumnName() }) });
              }
          )
      )
      .then(() => {
          let character = result.reduce((res, pair) => Object.assign(res, { [pair.key]: pair.value }), {});
          session.close();

          let mounts = [];
          let relationships = [];
          let connections = [];
          let weapons = [];
          let languages = [];

          sql.getSession()
          .then(s => { session = s; return session.getSchema(Config.MYSQL_CHARDB) })
          .then(() => {
              return Promise.all([
                  session.sql("USE " + Config.MYSQL_CHARDB).execute(),
                  session.sql("select * from Mounts where charid = ? order by current desc;").bind([character.ID]).execute(row => { mounts.push(row) }),
                  session.sql("select c.name, r.reltype, 'pc' as chartype, r.pcid from Relationships r join Characters c on r.pcID = c.id where r.char1 = ?;").bind([character.ID]).execute(row => { relationships.push(row) }),
                  session.sql("select c.npcname as name, r.reltype, 'npc' as chartype, r.npcid from Relationships r join npcMainTable c on r.npcID = c.id where r.char1 = ?;").bind([character.ID]).execute(row => { relationships.push(row) }),
                  session.sql("select c.name, cn.connectionType, 'pc' as chartype, c.id from pcConnections cn join Characters c on c.id = cn.familypcid where cn.basepcid = ?").bind([character.ID]).execute(row => { connections.push(row); }),
                  session.sql("select c.npcname as name, cn.connectionType, 'npc' as chartype, c.id from npcConnections cn join npcMainTable c on c.id = cn.npcid where cn.pcid = ?").bind([character.ID]).execute(row => { connections.push(row); }),
                  session.sql("select Axes, Swords, Daggers, Lances, Maces, QStaves, Whips, Unarmed, LBows, SBows, CBows, Thrown, Fire, Wind, Thunder, Light, Dark, Staves, MagicType, Civilian FROM Weapons WHERE charid = ?").bind([character.ID]).execute(row => { weapons.push(row); }),
                  session.sql("select Tr, TrNotes, De, ODe, HDe, OHDe, DeNotes, Me, AMe, MeNotes, At, Az, NoAt, AtNotes, Ki, RuKi, Da, KiNotes, Ro, RoNotes FROM Languages WHERE charid = ?").bind([character.ID]).execute(row => { languages.push(row); })
              ]);
          })
          .then(() => {
              if (mounts.length > 0) {
                  character.mounts = [];

                  mounts.forEach(m => {
                      character.mounts.push({
                          CharID: m[0],
                          MountName: m[1],
                          MountGender: m[2],
                          MountColor: m[3],
                          MountType: m[4],
                          Current: m[5],
                          Status: m[6],
                          Notes: m[7]
                      })
                  });
              }

              if (relationships.length > 0) {
                  character.relationships = [];

                  relationships.forEach(r => {
                      character.relationships.push({
                          Name: r[0],
                          Relationship: r[1],
                          CharType: r[2],
                          CharID: r[3]
                      })
                  });
              }

              if (connections.length > 0) {
                  character.connections = [];

                  connections.forEach(c => {
                      character.connections.push({
                          Name: c[0],
                          Relationship: c[1],
                          CharType: c[2],
                          CharID: c[3]
                      });
                  });
              }

              if (weapons.length > 0) {
                  character.weapons = {
                      Axes: weapons[0][0]?.trim() ?? '',
                      Swords: weapons[0][1]?.trim() ?? '',
                      Daggers: weapons[0][2]?.trim() ?? '',
                      Lances: weapons[0][3]?.trim() ?? '',
                      Maces: weapons[0][4]?.trim() ?? '',
                      QStaves: weapons[0][5]?.trim() ?? '',
                      Whips: weapons[0][6]?.trim() ?? '',
                      Unarmed: weapons[0][7]?.trim() ?? '',
                      LBows: weapons[0][8]?.trim() ?? '',
                      SBows: weapons[0][9]?.trim() ?? '',
                      CBows: weapons[0][10]?.trim() ?? '',
                      Thrown: weapons[0][11]?.trim() ?? '',
                      Fire: weapons[0][12]?.trim() ?? '',
                      Wind: weapons[0][13]?.trim() ?? '',
                      Thunder: weapons[0][14]?.trim() ?? '',
                      Light: weapons[0][15]?.trim() ?? '',
                      Dark: weapons[0][16]?.trim() ?? '',
                      Staves: weapons[0][17]?.trim() ?? '',
                      MagicType: weapons[0][18],
                      Civilian: weapons[0][19]
                  }
              }

              if (languages.length > 0) {
                  character.languages = {
                      Trade: languages[0][0]?.trim() ?? '',
                      TradeNotes: languages[0][1]?.trim() ?? '',
                      Dentorian: languages[0][2]?.trim() ?? '',
                      OldDentorian: languages[0][3]?.trim() ?? '',
                      HighDentorian: languages[0][4]?.trim() ?? '',
                      OldHighDentorian: languages[0][5]?.trim() ?? '',
                      DentorianNotes: languages[0][6]?.trim() ?? '',
                      Megami: languages[0][7]?.trim() ?? '',
                      AncientMegami: languages[0][8]?.trim() ?? '',
                      MegamiNotes: languages[0][9]?.trim() ?? '',
                      Atsirian: languages[0][10]?.trim() ?? '',
                      Azsharan: languages[0][11]?.trim() ?? '',
                      NomadicAtsirian: languages[0][12]?.trim() ?? '',
                      AtsirianNotes: languages[0][13]?.trim() ?? '',
                      Kilian: languages[0][14]?.trim() ?? '',
                      RunicKilian: languages[0][15]?.trim() ?? '',
                      Danaan: languages[0][16]?.trim() ?? '',
                      KilianNotes: languages[0][17]?.trim() ?? '',
                      Romani: languages[0][18]?.trim() ?? '',
                      RomaniNotes: languages[0][19]?.trim() ?? ''
                  }
              }

              res.status(200).json(character);

              session.close();
          });
      })
      .catch(e => {
          res.status(503).json("API Error");
      });
    });

    router.put('/:id', checkJwt, checkRoleAdmin, function (req, res, next) {
      let session;
      let character = req.body;

      const result = schema.validate(character);

      if (result.error !== undefined) {
          return res.status(500).json(result.error);
      }

      sql.getSession()
      .then(s => { session = s; return session.getSchema(Config.MYSQL_CHARDB) })
      .then(s => { return s.getTable("Characters") })
      .then(t =>
          t.update()
          .set('picture', character.picture)
          .set('name', character.name)
          .set('nickname1', character.nickname1)
          .set('nickname2', character.nickname2)
          .set('journal', character.journal)
          .set('jobs', character.jobs)
          .set('subjobs', character.subjobs)
          .set('socialclass', character.socialclass)
          .set('country', character.country)
          .set('hometown', character.hometown)
          .set('house', character.house)
          .set('birthmonth', character.birthmonth)
          .set('birthdate', character.birthdate)
          .set('year', character.year)
          .set('zodiac', character.zodiac)
          .set('bloodtype', character.bloodtype)
          .set('sect', character.sect)
          .set('player', character.player)
          .set('queued', character.queued)
          .set('adoptable', character.adoptable)
          .set('haircolor', character.haircolor)
          .set('eyecolor', character.eyecolor)
          .set('heightfeet', character.heightfeet)
          .set('heightinches', character.heightinches)
          .set('heightcms', character.heightcms)
          .set('build', character.build)
          .set('skintone', character.skintone)
          .set('cupsize', character.cupsize)
          .set('domhand', character.domhand)
          .set('identifiers', character.identifiers)
          .set('class', character.class)
          .set('pastclasses', character.pastclasses)
          .set('mountcombat', character.mountcombat)
          .set('orientation', character.orientation)
          .set('noncombat', character.noncombat)
          .set('gender', character.gender)
          .set('status', character.status)
          .where('id = :id')
          .bind('id', req.params.id)
          .execute()
          .then(() => res.status(200).json({status: 'updated'}))
          .catch(err => {
              res.status(500).json({status: err});
          })
      )
      .catch(e => {
          res.status(503).json("API Error");
      });
    });

    router.post('/', checkJwt, checkRoleAdmin, function (req, res, next) {
        let session;
        let character = req.body;

        const result = schema.validate(character);

        if (result.error !== undefined) {
            return res.status(500).json(result.error);
        }

        sql.getSession()
        .then(s => { session = s; return session.getSchema(Config.MYSQL_CHARDB) })
        .then(s => { return s.getTable("Characters") })
        .then(t =>
            t.insert([
                'picture', 'name', 'nickname1', 'nickname2', 'journal', 'jobs', 'subjobs', 'socialclass',
                'country', 'hometown', 'house', 'birthmonth', 'birthdate', 'year', 'zodiac', 'bloodtype',
                'sect', 'player', 'queued', 'adoptable', 'haircolor', 'eyecolor', 'heightfeet', 'heightinches',
                'heightcms', 'build', 'skintone', 'cupsize', 'domhand', 'identifiers', 'class', 'pastclasses',
                'mountcombat', 'orientation', 'noncombat', 'gender', 'status', 'Special'
            ])
            .values(
                character.picture, character.name, character.nickname1, character.nickname2, character.journal,
                character.jobs, character.subjobs, character.socialclass, character.country, character.hometown,
                character.house, character.birthmonth, character.birthdate, character.year, character.zodiac,
                character.bloodtype, character.sect, character.player, character.queued, character.adoptable,
                character.haircolor, character.eyecolor, character.heightfeet, character.heightinches,
                character.heightcms, character.build, character.skintone, character.cupsize, character.domhand,
                character.identifiers, character.class, character.pastclasses, character.mountcombat,
                character.orientation, character.noncombat, character.gender, character.status, character.Special
            )
            .execute()
            .then(async r => res.status(200).json({status: 'inserted', id: r.getAutoIncrementValue()}))
            .catch(err => {
                res.status(500).json({status: err});
            })
        )
        .catch(e => {
            res.status(503).json("API Error");
        });
    });

    return router;
}

const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: Config.FUSIONAUTH_SERVER + '/.well-known/jwks.json'
    }),
    issuer: [Config.FUSIONAUTH_SERVER],
    algorithms: ['ES256'],
    getToken: function fromHeaderOrQuerystring (req) {
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            return req.headers.authorization.split(' ')[1];
        } else if (req.query && req.query.token) {
            return req.query.token;
        }

        return null;
    }
});

const checkRoleAdmin = (req, res, next) => {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
        token = req.query.token;
    }

    const decoded = jwtDecode(token);

    if (decoded.roles.includes('Admin')) {
        next();
    } else {
        res.status(401).json('Unauthorized. User must be an Admin.');
    }
}

const schema = joi.object().keys({
    ID: joi.number().optional(),
    picture: joi.string().min(5).max(200).pattern(/(jpg|png|gif)$/).required(),
    name: joi.string().min(1).max(30).required(),
    nickname1: joi.string().max(30).allow('', null),
    nickname2: joi.string().max(30).allow('', null),
    journal: joi.string().min(1).max(30).required(),
    identifiers: joi.string().allow('', null),
    noncombat: joi.string().allow('', null),
    jobs: joi.string().max(200).allow('', null),
    subjobs: joi.string().max(200).allow('', null),
    socialclass: joi.string().min(1).max(30).required(),
    country: joi.string().min(1).max(10).valid('Korin', 'Dentoria', 'Kanemoria', 'Megam', 'Kilia', 'Hanalan', 'Atsiria', 'Romani').required(),
    hometown: joi.string().max(30).allow('', null),
    house: joi.string().max(50).allow('', null),
    birthmonth: joi.string().min(1).max(10).valid('January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'Novemeber', 'December').required(),
    birthdate: joi.number().less(31).required(),
    year: joi.number().less(650).required(),
    zodiac: joi.string().max(30).valid('Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces').required(),
    bloodtype: joi.string().max(4).valid('B', 'A', 'AB', 'O', 'B-', 'B+').required(),
    sect: joi.string().max(21).valid('Unknown', 'Neutral', 'Pillar of Light', 'Messenger of Darkness', 'Silent One').required(),
    status: joi.string().max(20).valid('Normal', 'Dead', 'Missing', 'Incapacitated').required(),
    player: joi.string().max(20).valid('Elzie', 'Elaine', 'Frozen', 'Playerless', 'Meg', 'Rosa', 'Sara', 'Nineveh', 'Dots', 'Mike', 'Silvie', 'Vicki').required(),
    haircolor: joi.string().max(20).required(),
    eyecolor: joi.string().max(20).required(),
    skintone: joi.string().max(10).required(),
    cupsize: joi.string().max(3).valid('A', 'B', 'C', 'D', 'N/A', 'DD'),
    domhand: joi.string().max(20).valid('Right', 'Left', 'Mixed', 'Ambidextrous').required(),
    orientation: joi.string().max(20).valid('Bicurious', 'Straight', 'Gay', 'Bi', 'Asexual', 'Undecided', 'Unknown', 'Bisexual').required(),
    gender: joi.string().trim().max(1).valid('F', 'M', 'N').required(),
    heightfeet: joi.number().less(7).required(),
    heightinches: joi.number().less(13).required(),
    heightcms: joi.number().less(200).required(),
    build: joi.string().max(11).required(),
    class: joi.string().max(20).allow('', null),
    pastclasses: joi.string().allow('', null),
    mountcombat: joi.number().less(2).required(),
    Special: joi.string().max(20).allow('', null),
    queued: joi.number().less(2).required(),
    adoptable: joi.number().less(2).required(),
    connections: joi.optional(),
    languages: joi.optional(),
    weapons: joi.optional(),
    mounts: joi.optional()
});