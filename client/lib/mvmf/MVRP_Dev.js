
/*
import { MV   } from '@metaversalcorp/mvmf';
import '@metaversalcorp/mvrp';
import '@metaversalcorp/mvio';
import '@metaversalcorp/mvrest';
*/
/*
const { MV } = require ('@metaversalcorp/mvmf');
require ('@metaversalcorp/mvrp');
require ('@metaversalcorp/mvio');
require ('@metaversalcorp/mvrest');
*/

MV.MVRP.Dev = MV.Library ('MVRP_Dev', 'Copyright 2023-2024 Metaversal Corporation. All rights reserved.', 'Metaversal RP1 Dev', '0.23.19');

MV.MVRP.Dev.Class.RDCOMPANY_NAME = class extends MV.MVMF.Class.BASE
{
   constructor (sRDCompanyId, wsEnglish)
   {
      super ()

      this.Set (sRDCompanyId, wsEnglish);
   }

   Set (sRDCompanyId, wsEnglish)
   {
      this.sRDCompanyId = sRDCompanyId;
      this.wsEnglish    = wsEnglish;
   };

   static MAP =
   {
      sRDCompanyId : MV.MVSB.MAP.FIELD.STRING (31),
      abReserved_A : MV.MVSB.MAP.FIELD.PAD (1),
      wsEnglish    : MV.MVSB.MAP.FIELD.STRING_W (64),
   }
};

MV.MVRP.Dev.Class.RDCOMPANY_ENTITY = class extends MV.MVMF.Class.BASE
{
   constructor (sGeoRegionId, bType, bTIN, wsTIN, wsName)
   {
      super ();

      this.Set (sGeoRegionId, bType, bTIN, wsTIN, wsName);
   }

   Set (sGeoRegionId, bType, bTIN, wsTIN, wsName)
   {
      this.sGeoRegionId = sGeoRegionId;
      this.bType        = bType;
      this.bTIN         = bTIN;
      this.wsTIN        = wsTIN;
      this.wsName       = wsName;
   };

   static MAP =
   {
      pCountry          :
      {
         sGeoRegionId   : MV.MVSB.MAP.FIELD.STRING (2),
         bType          : MV.MVSB.MAP.FIELD.BYTE,
         bTIN           : MV.MVSB.MAP.FIELD.BYTE,
         abReserved_A   : MV.MVSB.MAP.FIELD.PAD (12),
      },
      wsTIN             : MV.MVSB.MAP.FIELD.STRING_W (16),
      wsName            : MV.MVSB.MAP.FIELD.STRING_W (64),
   }
};

MV.MVRP.Dev.Class.RDCOMPANY_ADDRESS = class extends MV.MVMF.Class.BASE
{
   constructor (wsStreet_1, wsStreet_2, wsCity, wsState, wsPostal, wsPhone, sGeoRegionId, sGeoStateId)
   {
      super ();

      this.Set (wsStreet_1, wsStreet_2, wsCity, wsState, wsPostal, wsPhone, sGeoRegionId, sGeoStateId);
   }

   Set (wsStreet_1, wsStreet_2, wsCity, wsState, wsPostal, wsPhone, sGeoRegionId, sGeoStateId)
   {
      this.wsStreet_1        = wsStreet_1;
      this.wsStreet_2        = wsStreet_2;
      this.wsCity            = wsCity;
      this.wsState           = wsState;
      this.wsPostal          = wsPostal;
      this.wsPhone           = wsPhone;
      this.sGeoRegionId      = sGeoRegionId;
      this.sGeoStateId       = sGeoStateId;
   };

   static MAP =
   {
      wsStreet_1        : MV.MVSB.MAP.FIELD.STRING_W (32),
      wsStreet_2        : MV.MVSB.MAP.FIELD.STRING_W (32),
      wsCity            : MV.MVSB.MAP.FIELD.STRING_W (24),
      wsState           : MV.MVSB.MAP.FIELD.STRING_W (24),
      wsPostal          : MV.MVSB.MAP.FIELD.STRING_W (16),
      wsPhone           : MV.MVSB.MAP.FIELD.STRING_W (16),
      abReserved_A      : MV.MVSB.MAP.FIELD.PAD (12),
      sGeoRegionId      : MV.MVSB.MAP.FIELD.STRING (2),
      sGeoStateId       : MV.MVSB.MAP.FIELD.STRING (2),
   }
};

MV.MVRP.Dev.Class.RDCOMPANY_ADMIN = class extends MV.MVMF.Class.BASE
{
   constructor (bGender, wsPre, wsFirst, wsMiddle, wsLast, wsPost, wsTitle)
   {
      super ();

      this.Set (bGender, wsPre, wsFirst, wsMiddle, wsLast, wsPost, wsTitle);
   }

   Set (bGender, wsPre, wsFirst, wsMiddle, wsLast, wsPost, wsTitle)
   {
      this.bGender  = bGender;
      this.wsPre    = wsPre;
      this.wsFirst  = wsFirst;
      this.wsMiddle = wsMiddle;
      this.wsLast   = wsLast;
      this.wsPost   = wsPost;
      this.wsTitle  = wsTitle;
   };

   static MAP =
   {
      abReserved_A      : MV.MVSB.MAP.FIELD.PAD (7),
      bGender           : MV.MVSB.MAP.FIELD.BYTE,
      wsPre             : MV.MVSB.MAP.FIELD.STRING_W (4),
      wsFirst           : MV.MVSB.MAP.FIELD.STRING_W (16),
      wsMiddle          : MV.MVSB.MAP.FIELD.STRING_W (16),
      wsLast            : MV.MVSB.MAP.FIELD.STRING_W (16),
      wsPost            : MV.MVSB.MAP.FIELD.STRING_W (4),
      wsTitle           : MV.MVSB.MAP.FIELD.STRING_W (32)
   }
};

MV.MVRP.Dev.Class.RDSERVICE_NAME = class extends MV.MVMF.Class.BASE
{
   constructor (sRDServiceId, wsEnglish)
   {
      super ();

      this.Set (sRDServiceId, wsEnglish);
   }

   Set (sRDServiceId, wsEnglish)
   {
      this.sRDServiceId;
      this.wsEnglish;
   };

   static MAP =
   {
      sRDServiceId : MV.MVSB.MAP.FIELD.STRING (31),
      abReserved_A : MV.MVSB.MAP.FIELD.PAD (1),
      wsEnglish    : MV.MVSB.MAP.FIELD.STRING_W (64),
   }
};

MV.MVRP.Dev.Class.RDENVIRONMENT_NAME = class extends MV.MVMF.Class.BASE
{
   constructor (sRDEnvironmentId)
   {
      super ();

      this.Set (sRDEnvironmentId);
   }

   Set (sRDEnvironmentId)
   {
      this.sRDEnvironmentId = sRDEnvironmentId;
   };

   static MAP =
   {
      sRDEnvironmentId : MV.MVSB.MAP.FIELD.STRING (31),
      abReserved_A     : MV.MVSB.MAP.FIELD.PAD (1),
   }
};

MV.MVRP.Dev.Class.RDENVIRONMENT_CONFIG = class extends MV.MVMF.Class.BASE
{
   constructor (sServiceId, sConnect)
   {
      super ();

      this.Set (sServiceId, sConnect);
   }

   Set (sServiceId, sConnect)
   {
      this.sServiceId = sServiceId;
      this.sConnect   = sConnect;
   };

   static MAP =
   {
      sServiceId : MV.MVSB.MAP.FIELD.STRING (32),
      sConnect   : MV.MVSB.MAP.FIELD.STRING (128),
   }
};

MV.MVRP.Dev.Class.RDACTIVITY_NAME = class extends MV.MVMF.Class.BASE
{
   constructor (sRDActivityId, wsEnglish)
   {
      super ();

      this.Set (sRDActivityId, wsEnglish);
   }

   Set (sRDActivityId, wsEnglish)
   {
      this.sRDActivityId;
      this.wsEnglish;
   };

   static MAP =
   {
      sRDActivityId : MV.MVSB.MAP.FIELD.STRING (31),
      abReserved_A  : MV.MVSB.MAP.FIELD.PAD (1),
      wsEnglish     : MV.MVSB.MAP.FIELD.STRING_W (64),
   }
};

MV.MVRP.Dev.Class.RDFABRIC_NAME = class extends MV.MVMF.Class.BASE
{
   constructor (sRDFabricId, wsEnglish)
   {
      super ();

      this.Set (sRDFabricId, wsEnglish);
   }

   Set (sRDFabricId, wsEnglish)
   {
      this.sRDFabricId = sRDFabricId;
      this.wsEnglish   = wsEnglish;
   };

   static MAP =
   {
      sRDFabricId                   : MV.MVSB.MAP.FIELD.STRING (31),
      abReserved_A                  : MV.MVSB.MAP.FIELD.PAD (1),
      wsEnglish                     : MV.MVSB.MAP.FIELD.STRING_W (64),
   }
};

MV.MVRP.Dev.Class.RDFABRIC_PATH = class extends MV.MVMF.Class.BASE
{
   constructor (wClass_Primary, twObjectIx_Primary, wClass_Secondary, twObjectIx_Secondary)
   {
      super ();

      this.Set (wClass_Primary, twObjectIx_Primary, wClass_Secondary, twObjectIx_Secondary)
   }

   Set (wClass_Primary, twObjectIx_Primary, wClass_Secondary, twObjectIx_Secondary)
   {
      this.wClass_Primary       = wClass_Primary;
      this.twObjectIx_Primary   = twObjectIx_Primary;
      this.wClass_Secondary     = wClass_Secondary;
      this.twObjectIx_Secondary = twObjectIx_Secondary;
   };

   static MAP =
   {
      twObjectIx_Primary                  : MV.MVSB.MAP.FIELD.TWORD,
      wClass_Primary                      : MV.MVSB.MAP.FIELD.WORD,
      twObjectIx_Secondary                : MV.MVSB.MAP.FIELD.TWORD,
      wClass_Secondary                    : MV.MVSB.MAP.FIELD.WORD,
   }
};

MV.MVRP.Dev.Class.RDFABRIC_CONFIG = class extends MV.MVMF.Class.BASE
{
   constructor (twPersonaIx, twObjectIx, bType, sRDCompanyId, wsName, sUrl, dA, dB, dC, dWidth, dDepth, dHeight, dRotation)
   {
      super ();

      this.Set (twPersonaIx, twObjectIx, bType, sRDCompanyId, wsName, sUrl, dA, dB, dC, dWidth, dDepth, dHeight, dRotation);
   }

   Set (twPersonaIx, twObjectIx, bType, sRDCompanyId, wsName, sUrl, dA, dB, dC, dWidth, dDepth, dHeight, dRotation)
   {
      this.twPersonaIx        = twPersonaIx;

      this.twObjectIx         = twObjectIx;
      this.bType              = bType;

      this.sRDCompanyId       = sRDCompanyId;
      this.wsName             = wsName;
      this.sUrl               = sUrl;

      this.dA                 = dA;
      this.dB                 = dB;
      this.dC                 = dC;
      this.dWidth             = dWidth;
      this.dDepth             = dDepth;
      this.dHeight            = dHeight;
      this.dRotation          = dRotation;
   };

   static MAP =
   {
      twPersonaIx                         : MV.MVSB.MAP.FIELD.TWORD8,

      bType                               : MV.MVSB.MAP.FIELD.BYTE,
      sRDCompanyId                        : MV.MVSB.MAP.FIELD.STRING   (31),
      wsName                              : MV.MVSB.MAP.FIELD.STRING_W (48),
      sUrl                                : MV.MVSB.MAP.FIELD.STRING   (128),

      dA                                  : MV.MVSB.MAP.FIELD.DOUBLE,
      dB                                  : MV.MVSB.MAP.FIELD.DOUBLE,
      dC                                  : MV.MVSB.MAP.FIELD.DOUBLE,
      dWidth                              : MV.MVSB.MAP.FIELD.DOUBLE,
      dDepth                              : MV.MVSB.MAP.FIELD.DOUBLE,
      dHeight                             : MV.MVSB.MAP.FIELD.DOUBLE,
      dRotation                           : MV.MVSB.MAP.FIELD.DOUBLE
   }
};

MV.MVRP.Dev.IO_SESSION_RP1 = class extends MV.MVIO.IO_SESSION
{
   static factory ()
   {
      return new this.FACTORY ('MVIO', 'Session_RP1', MV.MVRP.Dev.IO_SESSION_RP1.apAction);
   }

   #pParams;

   #Request (sAction)
   {
      return this.pClient.Request (MV.MVRP.Dev.IO_SESSION_RP1.#apAction[sAction]);
   }

   #Attempt (nReadyState)
   {

      this.pModel.dwResult = 0;

      this.pModel.ReadyState (nReadyState);

      let bResult = this.pClient.Login (this.#pParams);

      if (bResult == false)
         this.#Failure (-1);

      return bResult;
   }

   #Failure (dwResult)
   {

      this.pModel.dwResult = dwResult;

      this.pModel.ReadyState (this.pModel.eSTATE.LOGGEDOUT);
   }

   #Success ()
   {

      this.pModel.ReadyState (this.pModel.eSTATE.LOGGEDIN);
   }

   Progress (pProgress)
   {
      super.Progress (pProgress);

      switch (pProgress.nProgress)
      {
         case this.ePROGRESS.LOGIN_RESULT:
            if (pProgress.bResult != false)
            {
               this.#Success ();
            }
            else
            {
               this.#Failure (pProgress.dwResult);
            }
            break;

         case this.ePROGRESS.LOGOUT_RESULT:
            if (pProgress.bResult != false)
            {
               this.pModel.dwResult = 0;

               this.pModel.ReadyState (this.pModel.eSTATE.LOGGEDOUT);
            }
            break;
      }

      this.pModel.Progress (pProgress);
   }

   Login_Create ()
   {
      return {};
   }

   Login_Destroy (pLogin)
   {
      return null;
   }

   Login_Request (pParams, pLogin)
   {
      let pIAction, pRequest;

      if (pParams)
      {
         pIAction = this.#Request ('LOGIN');
         pRequest = pIAction.pRequest;

         pRequest.acToken64U_RP1 = pParams.acToken64U_RP1 ? pParams.acToken64U_RP1 : '';
      }
      else if (pLogin)
      {
         pIAction = this.#Request ('LOGIN');
         pRequest = pIAction.pRequest;

         pRequest.acToken64U_RP1 = pLogin.sSessionToken ? pLogin.sSessionToken : '';
      }

      return pIAction;
   }

   Login_Response (pParams, pLogin, pIAction, bVoluntary)
   {
      let bResult = false;

      let pResponse = pIAction.pResponse;

      pLogin.sSessionToken = pResponse.sSessionToken;

      return true;
   }

   Logout_Request (pParams, pLogin)
   {
      let pIAction = this.#Request ('LOGOUT');
      let pRequest = pIAction.pRequest;

      return pIAction;
   }

   Logout_Response (pParams, pLogin, pIAction, bVoluntary, bDisconnected)
   {
      let bResult = false;

   }

   Login (acToken64U_RP1)
   {
      let bResult = false;

      if (this.pModel.ReadyState () == this.pModel.eSTATE.LOGGEDOUT)
      {
         this.#pParams =
         {
            acToken64U_RP1
         };

         bResult = this.#Attempt (this.pModel.eSTATE.LOGGING);
      }

      return bResult;
   }

   Logout ()
   {
      let bResult = false;

      if (this.pModel.ReadyState () == this.pModel.eSTATE.LOGGEDIN)
      {
         this.pModel.ReadyState (this.pModel.eSTATE.LOGGING);

         bResult = this.pClient.Logout (this.#pParams);
      }

      return bResult;
   }

   static apAction =
   {
      NULL   : new MV.MVRest.SERVICE.CLIENT.ACTION
               (
                  'null',
                  {
                  },
                  MV.MVRest.POST_JSON
               ),
   }

   static #apAction =
   {
      LOGIN  : new MV.MVIO.SERVICE.CLIENT.ACTION
               (
                  'login',
                  {
                     acToken64U_RP1      : ''
                  }
               ),

      LOGOUT : new MV.MVIO.SERVICE.CLIENT.ACTION
               (
                  'logout',
                  {
                  }
               ),
   }
}

MV.MVRP.Dev.IO_SESSION_RP1.FACTORY = class extends MV.MVIO.IO_SESSION.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Dev.IO_SESSION_RP1 (this.pReference, pClient);
   }
}

MV.MVRP.Dev.REST_SESSION_RP1 = class extends MV.MVRest.REST_SESSION
{
   static factory ()
   {
      return new this.FACTORY ('MVRest', 'Session_RP1', MV.MVRP.Dev.REST_SESSION_RP1.apAction);
   }

   #pParams;

   #Request (sAction)
   {
      return this.pClient.Request (MV.MVRP.Dev.REST_SESSION_RP1.#apAction[sAction]);
   }

   #Attempt (nReadyState)
   {

      this.pModel.dwResult = 0;

      this.pModel.ReadyState (nReadyState);

      let bResult = this.pClient.Login (this.#pParams);

      if (bResult == false)
         this.#Failure (-1);

      return bResult;
   }

   #Failure (dwResult)
   {

      this.pModel.dwResult = dwResult;

      this.pModel.ReadyState (this.pModel.eSTATE.LOGGEDOUT);
   }

   #Success ()
   {

      this.pModel.ReadyState (this.pModel.eSTATE.LOGGEDIN);
   }

   Progress (pProgress)
   {
      super.Progress (pProgress);

      switch (pProgress.nProgress)
      {
         case this.ePROGRESS.LOGIN_RESULT:
            if (pProgress.bResult != false)
            {
               this.#Success ();
            }
            else
            {
               this.#Failure (pProgress.dwResult);
            }
            break;

         case this.ePROGRESS.LOGOUT_RESULT:
            if (pProgress.bResult != false)
            {
               this.pModel.dwResult = 0;

               this.pModel.ReadyState (this.pModel.eSTATE.LOGGEDOUT);
            }
            break;
      }

      this.pModel.Progress (pProgress);
   }

   Login_Create ()
   {
      return {};
   }

   Login_Destroy (pLogin)
   {
      return null;
   }

   Login_Request (pParams, pLogin)
   {
      let pIAction, pRequest;

      if (pParams)
      {
         pIAction = this.#Request ('LOGIN');
         pRequest = pIAction.pRequest;

         pRequest.acToken64U_RP1 = pParams.acToken64U_RP1 ? pParams.acToken64U_RP1 : '';
      }

      return pIAction;
   }

   Login_Response (pParams, pLogin, pIAction, bVoluntary)
   {
      let bResult = false;

      let pResponse = pIAction.pResponse;

      pLogin.sSessionToken = pResponse.sSessionToken;

      return true;
   }

   Logout_Request (pParams, pLogin)
   {
      let pIAction = this.#Request ('LOGOUT');
      let pRequest = pIAction.pRequest;

      return pIAction;
   }

   Logout_Response (pParams, pLogin, pIAction, bVoluntary, bDisconnected)
   {
      let bResult = false;

   }

   Login (acToken64U_RP1)
   {
      let bResult = false;

      if (this.pModel.ReadyState () == this.pModel.eSTATE.LOGGEDOUT)
      {
         this.#pParams =
         {
            acToken64U_RP1
         };

         bResult = this.#Attempt (this.pModel.eSTATE.LOGGING);
      }

      return bResult;
   }

   Logout ()
   {
      let bResult = false;

      if (this.pModel.ReadyState () == this.pModel.eSTATE.LOGGEDIN)
      {
         this.pModel.ReadyState (this.pModel.eSTATE.LOGGING);

         bResult = this.pClient.Logout (this.#pParams);
      }

      return bResult;
   }

   static apAction =
   {
      NULL   : new MV.MVRest.SERVICE.CLIENT.ACTION
               (
                  'null',
                  {
                  },
                  MV.MVRest.POST_JSON
               ),
   }

   static #apAction =
   {
      LOGIN  : new MV.MVRest.SERVICE.CLIENT.ACTION
               (
                  'login',
                  {
                     acToken64U_RP1      : ''
                  },
                  MV.MVRest.POST_JSON
               ),

      LOGOUT : new MV.MVRest.SERVICE.CLIENT.ACTION
               (
                  'logout',
                  {
                  },
                  MV.MVRest.POST_JSON
               ),
   }
}

MV.MVRP.Dev.REST_SESSION_RP1.FACTORY = class extends MV.MVRest.REST_SESSION.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Dev.REST_SESSION_RP1 (this.pReference, pClient);
   }
}

MV.MVRP.SB_RUSER.apAction['RDUSER_OPEN'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (9 | ((50) << 16)),
   new MV.MVSB.MAP
   ({
      twRUserIx                     : MV.MVSB.MAP.FIELD.TWORD8,
      abReserved_A                  : MV.MVSB.MAP.FIELD.PAD (8),
   }),
   new MV.MVSB.MAP
   ({
      twRDUserIx                    : MV.MVSB.MAP.FIELD.TWORD8
   })
);

MV.MVRP.SB_RUSER.apAction['RDUSER_CLOSE'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (10 | ((50) << 16)),
   new MV.MVSB.MAP
   ({
      twRUserIx                     : MV.MVSB.MAP.FIELD.TWORD8,
      twRDUserIx                    : MV.MVSB.MAP.FIELD.TWORD8
   })
);

MV.MVRP.SB_RPERSONA.apAction['TOKEN'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (10 | ((51) << 16)),
   new MV.MVSB.MAP
   ({
      twRPersonaIx                      : MV.MVSB.MAP.FIELD.TWORD8,
      sRDCompanyId                      : MV.MVSB.MAP.FIELD.STRING (31),
      abReserved_A                      : MV.MVSB.MAP.FIELD.PAD (1),
      sRDServiceId                      : MV.MVSB.MAP.FIELD.STRING (31),
      abReserved_B                      : MV.MVSB.MAP.FIELD.PAD (1),
      abReserved_C                      : MV.MVSB.MAP.FIELD.PAD (32)
   }),
   new MV.MVSB.MAP
   ({
      acToken64U_RP1                    : MV.MVSB.MAP.FIELD.STRING (64),
   })
);

MV.MVRP.Dev.SB_RDROOT = class extends MV.MVSB.SB_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVSB',
         'RDRoot',

         59,

         MV.MVRP.Dev.SB_RDROOT.apAction,

         true,

         new MV.MVSB.MAP
         ({
            bPaused           : MV.MVSB.MAP.FIELD.BYTE,
            abReserved_A      : MV.MVSB.MAP.FIELD.PAD (15),
         })
      );
   }

}

MV.MVRP.Dev.SB_RDROOT.FACTORY = class extends MV.MVSB.SB_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Dev.SB_RDROOT (this.pReference, this.pMap, pClient);
   }
}

MV.MVRP.Dev.SB_RDROOT.apAction = {};

MV.MVRP.Dev.SB_RDROOT.apAction['PAUSE'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (1 | ((59) << 16)),
   new MV.MVSB.MAP
   ({
      twRDRootIx                    : MV.MVSB.MAP.FIELD.TWORD8,
      abReserved_A                  : MV.MVSB.MAP.FIELD.PAD (8),
   }),
);

MV.MVRP.Dev.SB_RDROOT.apAction['CONTINUE'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (2 | ((59) << 16)),
   new MV.MVSB.MAP
   ({
      twRDRootIx                    : MV.MVSB.MAP.FIELD.TWORD8,
      abReserved_A                  : MV.MVSB.MAP.FIELD.PAD (8),
   }),
);

MV.MVRP.Dev.SB_RDROOT.apAction['PURGE'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (3 | ((59) << 16)),
   new MV.MVSB.MAP
   ({
      twRDRootIx                    : MV.MVSB.MAP.FIELD.TWORD8,
      abReserved_A                  : MV.MVSB.MAP.FIELD.PAD (8),
      Edge_twConnectionIx           : MV.MVSB.MAP.FIELD.TWORD,
      Edge_wInterface_ServerIx      : MV.MVSB.MAP.FIELD.WORD,
      Auth_twConnectionIx           : MV.MVSB.MAP.FIELD.TWORD,
      Auth_wInterface_ServerIx      : MV.MVSB.MAP.FIELD.WORD,
   }),
);

MV.MVRP.Dev.SB_RDROOT.apAction['BOOT'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (4 | ((59) << 16)),
   new MV.MVSB.MAP
   ({
      twRDRootIx                    : MV.MVSB.MAP.FIELD.TWORD8,
      abReserved_A                  : MV.MVSB.MAP.FIELD.PAD (8),
      twServiceIx                   : MV.MVSB.MAP.FIELD.TWORD8,
      twEnvironmentIx               : MV.MVSB.MAP.FIELD.TWORD8,
   }),
);

MV.MVRP.Dev.SB_RDROOT.apAction['RDCOMPANY_OPEN'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (7 | ((59) << 16)),
   new MV.MVSB.MAP
   ({
      twRDRootIx                    : MV.MVSB.MAP.FIELD.TWORD8,
      abReserved_X                  : MV.MVSB.MAP.FIELD.PAD (16 + 40),
      twRPersonaIx_Owner            : MV.MVSB.MAP.FIELD.TWORD8,
      pName                         : MV.MVRP.Dev.Class.RDCOMPANY_NAME.MAP,
   }),
   new MV.MVSB.MAP
   ({
      twRDCompanyIx                 : MV.MVSB.MAP.FIELD.TWORD8,
   })
);

MV.MVRP.Dev.SB_RDROOT.apAction['RDCOMPANY_CLOSE'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (8 | ((59) << 16)),
   new MV.MVSB.MAP
   ({
      twRDRootIx                    : MV.MVSB.MAP.FIELD.TWORD8,
      abReserved_A                  : MV.MVSB.MAP.FIELD.PAD (8),
      twRDCompanyIx                 : MV.MVSB.MAP.FIELD.TWORD8,
   })
);

MV.MVRP.Dev.SB_RDUSER = class extends MV.MVSB.SB_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVSB',
         'RDUser',

         60,

         MV.MVRP.Dev.SB_RDUSER.apAction,

         true,

         new MV.MVSB.MAP
         ({
            abReserved_A                  : MV.MVSB.MAP.FIELD.PAD (32),
         })
      );
   }

}

MV.MVRP.Dev.SB_RDUSER.FACTORY = class extends MV.MVSB.SB_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Dev.SB_RDUSER (this.pReference, this.pMap, pClient);
   }
}

MV.MVRP.Dev.SB_RDUSER.apAction = {};

MV.MVRP.Dev.SB_RDUSER_RDCOMPANY = class extends MV.MVSB.SB_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVSB',
         'RDUser_RDCompany',

         61,

         MV.MVRP.Dev.SB_RDUSER_RDCOMPANY.apAction,

         false,

         new MV.MVSB.MAP
         ({
            bState             : MV.MVSB.MAP.FIELD.BYTE,
            bEnable            : MV.MVSB.MAP.FIELD.BYTE,
            abReserved_A       : MV.MVSB.MAP.FIELD.PAD (6),
            twRPersonaIx       : MV.MVSB.MAP.FIELD.TWORD8,
            pName              : MV.MVRP.Dev.Class.RDCOMPANY_NAME.MAP,
         })
      );
   }

}

MV.MVRP.Dev.SB_RDUSER_RDCOMPANY.FACTORY = class extends MV.MVSB.SB_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Dev.SB_RDUSER_RDCOMPANY (this.pReference, this.pMap, pClient);
   }
}

MV.MVRP.Dev.SB_RDUSER_RDCOMPANY.apAction = {};

MV.MVRP.Dev.SB_RDUSER_RDCOMPANY.apAction['ACCEPT'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (6 | ((62) << 16)),
   new MV.MVSB.MAP
   ({
      twRDCompanyIx     : MV.MVSB.MAP.FIELD.TWORD8,
      abReserved_A      : MV.MVSB.MAP.FIELD.PAD (8),
      twRPersonaIx      : MV.MVSB.MAP.FIELD.TWORD8,
   })
);

MV.MVRP.Dev.SB_RDUSER_RDCOMPANY.apAction['REJECT'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (7 | ((62) << 16)),
   new MV.MVSB.MAP
   ({
      twRDCompanyIx     : MV.MVSB.MAP.FIELD.TWORD8,
      abReserved_A      : MV.MVSB.MAP.FIELD.PAD (8),
      twRPersonaIx      : MV.MVSB.MAP.FIELD.TWORD8,
   })
);

MV.MVRP.Dev.SB_RDUSER_RDCOMPANY.apAction['BLOCK'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (8 | ((62) << 16)),
   new MV.MVSB.MAP
   ({
      twRDCompanyIx     : MV.MVSB.MAP.FIELD.TWORD8,
      abReserved_A      : MV.MVSB.MAP.FIELD.PAD (8),
      twRPersonaIx      : MV.MVSB.MAP.FIELD.TWORD8,
   })
);

MV.MVRP.Dev.SB_RDUSER_RDCOMPANY.apAction['UNBLOCK'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (9 | ((62) << 16)),
   new MV.MVSB.MAP
   ({
      twRDCompanyIx     : MV.MVSB.MAP.FIELD.TWORD8,
      abReserved_A      : MV.MVSB.MAP.FIELD.PAD (8),
      twRPersonaIx      : MV.MVSB.MAP.FIELD.TWORD8,
   })
);

MV.MVRP.Dev.SB_RDCOMPANY = class extends MV.MVSB.SB_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVSB',
         'RDCompany',

         62,

         MV.MVRP.Dev.SB_RDCOMPANY.apAction,

         true,

         new MV.MVSB.MAP
         ({
            sGUId                : MV.MVSB.MAP.FIELD.STRING (40),
            twRPersonaIx_Owner   : MV.MVSB.MAP.FIELD.TWORD8,
            abReserved_A         : MV.MVSB.MAP.FIELD.PAD (7),
            bPending             : MV.MVSB.MAP.FIELD.BYTE,
            pName                : MV.MVRP.Dev.Class.RDCOMPANY_NAME.MAP,

                                   wSize_Partial: [MV.MVSB.MAP.FIELD.eTYPE.SIZE, 0, "Partial"],

            pEntity              : MV.MVRP.Dev.Class.RDCOMPANY_ENTITY.MAP,
            pAddress_Office      : MV.MVRP.Dev.Class.RDCOMPANY_ADDRESS.MAP,
            pAddress_Mailing     : MV.MVRP.Dev.Class.RDCOMPANY_ADDRESS.MAP,
            pAdmin               : MV.MVRP.Dev.Class.RDCOMPANY_ADMIN.MAP,
         })
      );
   }

}

MV.MVRP.Dev.SB_RDCOMPANY.FACTORY = class extends MV.MVSB.SB_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Dev.SB_RDCOMPANY (this.pReference, this.pMap, pClient);
   }
}

MV.MVRP.Dev.SB_RDCOMPANY.apAction =
{
   NAME:             new MV.MVSB.SERVICE.CLIENT.ACTION
                     (
                        (1 | ((62) << 16)),
                        new MV.MVSB.MAP
                        ({
                           twRDCompanyIx     : MV.MVSB.MAP.FIELD.TWORD8,
                           abReserved_A      : MV.MVSB.MAP.FIELD.PAD (8),
                           pName             : MV.MVRP.Dev.Class.RDCOMPANY_NAME.MAP,
                        })
                     ),

   ENTITY:           new MV.MVSB.SERVICE.CLIENT.ACTION
                     (
                        (2 | ((62) << 16)),
                        new MV.MVSB.MAP
                        ({
                           twRDCompanyIx     : MV.MVSB.MAP.FIELD.TWORD8,
                           abReserved_A      : MV.MVSB.MAP.FIELD.PAD (8),
                           pEntity           : MV.MVRP.Dev.Class.RDCOMPANY_ENTITY.MAP,
                        })
                     ),

   ADDRESS:          new MV.MVSB.SERVICE.CLIENT.ACTION
                     (
                        (3 | ((62) << 16)),
                        new MV.MVSB.MAP
                        ({
                           twRDCompanyIx     : MV.MVSB.MAP.FIELD.TWORD8,
                           abReserved_A      : MV.MVSB.MAP.FIELD.PAD (8),
                           pAddress_Office   : MV.MVRP.Dev.Class.RDCOMPANY_ADDRESS.MAP,
                           pAddress_Mailing  : MV.MVRP.Dev.Class.RDCOMPANY_ADDRESS.MAP,
                        })
                     ),

   ADMIN:            new MV.MVSB.SERVICE.CLIENT.ACTION
                     (
                        (4 | ((62) << 16)),
                        new MV.MVSB.MAP
                        ({
                           twRDCompanyIx     : MV.MVSB.MAP.FIELD.TWORD8,
                           abReserved_A      : MV.MVSB.MAP.FIELD.PAD (8),
                           pAdmin            : MV.MVRP.Dev.Class.RDCOMPANY_ADMIN.MAP,
                        })
                     ),

   RPERSONA_INVITE:  new MV.MVSB.SERVICE.CLIENT.ACTION
                     (
                        (5 | ((62) << 16)),
                        new MV.MVSB.MAP
                        ({
                           twRDCompanyIx     : MV.MVSB.MAP.FIELD.TWORD8,
                           abReserved_A      : MV.MVSB.MAP.FIELD.PAD (8),
                           twRPersonaIx      : MV.MVSB.MAP.FIELD.TWORD8,
                        })
                     ),

   RPERSONA_RIGHTS:  new MV.MVSB.SERVICE.CLIENT.ACTION
                     (
                        (10 | ((62) << 16)),
                        new MV.MVSB.MAP
                        ({
                           twRDCompanyIx     : MV.MVSB.MAP.FIELD.TWORD8,
                           abReserved_A      : MV.MVSB.MAP.FIELD.PAD (8),
                           twRPersonaIx      : MV.MVSB.MAP.FIELD.TWORD8,
                           dwRights_Company  : MV.MVSB.MAP.FIELD.DWORD,
                           dwRights_Service  : MV.MVSB.MAP.FIELD.DWORD,
                           dwRights_Activity : MV.MVSB.MAP.FIELD.DWORD,
                           abReserved_B      : MV.MVSB.MAP.FIELD.PAD (4),
                        })
                     ),

   RPERSONA_DISABLE: new MV.MVSB.SERVICE.CLIENT.ACTION
                     (
                        (11 | ((62) << 16)),
                        new MV.MVSB.MAP
                        ({
                           twRDCompanyIx     : MV.MVSB.MAP.FIELD.TWORD8,
                           abReserved_A      : MV.MVSB.MAP.FIELD.PAD (8),
                           twRPersonaIx      : MV.MVSB.MAP.FIELD.TWORD8,
                        })
                     ),

   RPERSONA_ENABLE:  new MV.MVSB.SERVICE.CLIENT.ACTION
                     (
                        (12 | ((62) << 16)),
                        new MV.MVSB.MAP
                        ({
                           twRDCompanyIx     : MV.MVSB.MAP.FIELD.TWORD8,
                           abReserved_A      : MV.MVSB.MAP.FIELD.PAD (8),
                           twRPersonaIx      : MV.MVSB.MAP.FIELD.TWORD8,
                        })
                     ),

   RPERSONA_DELETE:  new MV.MVSB.SERVICE.CLIENT.ACTION
                     (
                        (13 | ((62) << 16)),
                        new MV.MVSB.MAP
                        ({
                           twRDCompanyIx     : MV.MVSB.MAP.FIELD.TWORD8,
                           abReserved_A      : MV.MVSB.MAP.FIELD.PAD (8),
                           twRPersonaIx      : MV.MVSB.MAP.FIELD.TWORD8,
                        })
                     ),

   RPERSONA_OWNER:   new MV.MVSB.SERVICE.CLIENT.ACTION
                     (
                        (14 | ((62) << 16)),
                        new MV.MVSB.MAP
                        ({
                           twRDCompanyIx     : MV.MVSB.MAP.FIELD.TWORD8,
                           abReserved_A      : MV.MVSB.MAP.FIELD.PAD (8),
                           twRPersonaIx      : MV.MVSB.MAP.FIELD.TWORD8,
                        })
                     ),

   RDSERVICE_OPEN:   new MV.MVSB.SERVICE.CLIENT.ACTION
                     (
                        (15 | ((62) << 16)),
                        new MV.MVSB.MAP
                        ({
                           twRDCompanyIx     : MV.MVSB.MAP.FIELD.TWORD8,
                           abReserved_A      : MV.MVSB.MAP.FIELD.PAD (16 + 40 + 8),
                           pName             : MV.MVRP.Dev.Class.RDSERVICE_NAME.MAP,
                        }),
                        new MV.MVSB.MAP
                        ({
                           twRDServiceIx     : MV.MVSB.MAP.FIELD.TWORD8,
                        })
                     ),

   RDSERVICE_CLOSE:  new MV.MVSB.SERVICE.CLIENT.ACTION
                     (
                        (16 | ((62) << 16)),
                        new MV.MVSB.MAP
                        ({
                           twRDCompanyIx     : MV.MVSB.MAP.FIELD.TWORD8,
                           abReserved_A      : MV.MVSB.MAP.FIELD.PAD (8),
                           twRDServiceIx     : MV.MVSB.MAP.FIELD.TWORD8,
                        })
                     ),

   RDFABRIC_OPEN:    new MV.MVSB.SERVICE.CLIENT.ACTION
                     (
                        (19 | ((62) << 16)),
                        new MV.MVSB.MAP
                        ({
                           twRDCompanyIx        : MV.MVSB.MAP.FIELD.TWORD8,

                           abReserved_A         : MV.MVSB.MAP.FIELD.PAD (32 + 40),
                           pName                : MV.MVRP.Dev.Class.RDFABRIC_NAME.MAP,
                           pPath                : MV.MVRP.Dev.Class.RDFABRIC_PATH.MAP,
                           pConfig              : MV.MVRP.Dev.Class.RDFABRIC_CONFIG.MAP,
                        }),
                        new MV.MVSB.MAP
                        ({
                           twRDFabricIx      : MV.MVSB.MAP.FIELD.TWORD8,
                        })
                     ),

   RDFABRIC_CLOSE:  new MV.MVSB.SERVICE.CLIENT.ACTION
                     (
                        (20 | ((62) << 16)),
                        new MV.MVSB.MAP
                        ({
                           twRDCompanyIx     : MV.MVSB.MAP.FIELD.TWORD8,
                           abReserved_A      : MV.MVSB.MAP.FIELD.PAD (16),
                           twRDFabricIx      : MV.MVSB.MAP.FIELD.TWORD8,
                           abReserved_B      : MV.MVSB.MAP.FIELD.PAD (16),
                        })
                     ),

   RDACTIVITY_OPEN:  new MV.MVSB.SERVICE.CLIENT.ACTION
                     (
                        (17 | ((62) << 16)),
                        new MV.MVSB.MAP
                        ({
                           twRDCompanyIx     : MV.MVSB.MAP.FIELD.TWORD8,
                           abReserved_A      : MV.MVSB.MAP.FIELD.PAD (16),
                           abReserved_X      : MV.MVSB.MAP.FIELD.PAD (40),
                           abReserved_B      : MV.MVSB.MAP.FIELD.PAD (8),
                           pName             : MV.MVRP.Dev.Class.RDACTIVITY_NAME.MAP,
                        }),
                        new MV.MVSB.MAP
                        ({
                           twRDActivityIx    : MV.MVSB.MAP.FIELD.TWORD8
                        })
                     ),

   RDACTIVITY_CLOSE: new MV.MVSB.SERVICE.CLIENT.ACTION
                     (
                        (18 | ((62) << 16)),
                        new MV.MVSB.MAP
                        ({
                           twRDCompanyIx     : MV.MVSB.MAP.FIELD.TWORD8,
                           abReserved_A      : MV.MVSB.MAP.FIELD.PAD (8),
                           twRDActivityIx    : MV.MVSB.MAP.FIELD.TWORD8,
                        })
                     )
};

MV.MVRP.Dev.SB_RDCOMPANY_RPERSONA = class extends MV.MVSB.SB_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVSB',
         'RDCompany_RPersona',

         63,

         MV.MVRP.Dev.SB_RDCOMPANY_RPERSONA.apAction,

         false,

         new MV.MVSB.MAP
         ({
            bState            : MV.MVSB.MAP.FIELD.BYTE,
            abReserved_A      : MV.MVSB.MAP.FIELD.PAD (3),
            dwRights_Company  : MV.MVSB.MAP.FIELD.DWORD,
            dwRights_Service  : MV.MVSB.MAP.FIELD.DWORD,
            dwRights_Activity : MV.MVSB.MAP.FIELD.DWORD,
            pName             : MV.MVRP.Class.RPERSONA_NAME.MAP,
         })
      );
   }

}

MV.MVRP.Dev.SB_RDCOMPANY_RPERSONA.FACTORY = class extends MV.MVSB.SB_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Dev.SB_RDCOMPANY_RPERSONA (this.pReference, this.pMap, pClient);
   }
}

MV.MVRP.Dev.SB_RDCOMPANY_RPERSONA.apAction =
{
   DISABLE: MV.MVRP.Dev.SB_RDCOMPANY.apAction['RPERSONA_DISABLE'],
   ENABLE:  MV.MVRP.Dev.SB_RDCOMPANY.apAction['RPERSONA_ENABLE'],
   RIGHTS:  MV.MVRP.Dev.SB_RDCOMPANY.apAction['RPERSONA_RIGHTS'],
   DELETE:  MV.MVRP.Dev.SB_RDCOMPANY.apAction['RPERSONA_DELETE'],
   OWNER:   MV.MVRP.Dev.SB_RDCOMPANY.apAction['RPERSONA_OWNER'],
};

MV.MVRP.Dev.SB_RDSERVICE = class extends MV.MVSB.SB_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVSB',
         'RDService',

         64,

         MV.MVRP.Dev.SB_RDSERVICE.apAction,

         true,

         new MV.MVSB.MAP
         ({
            sGUId             : MV.MVSB.MAP.FIELD.STRING (40),
            abReserved_A      : MV.MVSB.MAP.FIELD.PAD (5),
            bPending          : MV.MVSB.MAP.FIELD.BYTE,
            bPaused           : MV.MVSB.MAP.FIELD.BYTE,
            bAuthenticated    : MV.MVSB.MAP.FIELD.BYTE,
            pName             : MV.MVRP.Dev.Class.RDSERVICE_NAME.MAP,

                                wSize_Partial: [MV.MVSB.MAP.FIELD.eTYPE.SIZE, 0, "Partial"]
         })
      );
   }

}

MV.MVRP.Dev.SB_RDSERVICE.FACTORY = class extends MV.MVSB.SB_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Dev.SB_RDSERVICE (this.pReference, this.pMap, pClient);
   }
}

MV.MVRP.Dev.SB_RDSERVICE.apAction = {};

MV.MVRP.Dev.SB_RDSERVICE.apAction['NAME'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (3 | ((64) << 16)),
   new MV.MVSB.MAP
   ({
      twRDServiceIx     : MV.MVSB.MAP.FIELD.TWORD8,
      abReserved_A      : MV.MVSB.MAP.FIELD.PAD (8),
      pName             : MV.MVRP.Dev.Class.RDSERVICE_NAME.MAP,
   })
);

MV.MVRP.Dev.SB_RDSERVICE.apAction['RDENVIRONMENT_OPEN'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (4 | ((64) << 16)),
   new MV.MVSB.MAP
   ({
      twRDServiceIx     : MV.MVSB.MAP.FIELD.TWORD8,
      abReserved_X      : MV.MVSB.MAP.FIELD.PAD (16 + 40 + 5),
      bProduction       : MV.MVSB.MAP.FIELD.BYTE,
      abReserved_A      : MV.MVSB.MAP.FIELD.PAD (2),
      pName             : MV.MVRP.Dev.Class.RDENVIRONMENT_NAME.MAP,
      pConfig           : MV.MVRP.Dev.Class.RDENVIRONMENT_CONFIG.MAP,
   }),
   new MV.MVSB.MAP
   ({
      twRDEnvironmentIx    : MV.MVSB.MAP.FIELD.TWORD8
   })
);

MV.MVRP.Dev.SB_RDSERVICE.apAction['RDENVIRONMENT_CLOSE'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (5 | ((64) << 16)),
   new MV.MVSB.MAP
   ({
      twRDServiceIx     : MV.MVSB.MAP.FIELD.TWORD8,
      twRUserIx         : MV.MVSB.MAP.FIELD.TWORD8,
      twRDEnvironmentIx : MV.MVSB.MAP.FIELD.TWORD8,
   })
);

MV.MVRP.Dev.SB_RDENVIRONMENT = class extends MV.MVSB.SB_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVSB',
         'RDEnvironment',

         65,

         MV.MVRP.Dev.SB_RDENVIRONMENT.apAction,

         true,

         new MV.MVSB.MAP
         ({
            sGUId             : MV.MVSB.MAP.FIELD.STRING (40),
            abReserved_A      : MV.MVSB.MAP.FIELD.PAD (5),
            bProduction       : MV.MVSB.MAP.FIELD.BYTE,
            bPaused           : MV.MVSB.MAP.FIELD.BYTE,
            bAuthenticated    : MV.MVSB.MAP.FIELD.BYTE,
            pName             : MV.MVRP.Dev.Class.RDENVIRONMENT_NAME.MAP,
            pConfig           : MV.MVRP.Dev.Class.RDENVIRONMENT_CONFIG.MAP,
            abReserved_X      : MV.MVSB.MAP.FIELD.PAD (32),
            sLast             : MV.MVSB.MAP.FIELD.STRING (6),
            abReserved_B      : MV.MVSB.MAP.FIELD.PAD (2),

                                wSize_Partial: [MV.MVSB.MAP.FIELD.eTYPE.SIZE, 0, "Partial"],

            dwIPAddressIz     : MV.MVSB.MAP.FIELD.DWORD,
            dwSourceIz        : MV.MVSB.MAP.FIELD.DWORD,
            twSessionIz       : MV.MVSB.MAP.FIELD.TWORD8,
            abReserved_Z      : MV.MVSB.MAP.FIELD.PAD (32),
         })
      );
   }

}

MV.MVRP.Dev.SB_RDENVIRONMENT.FACTORY = class extends MV.MVSB.SB_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Dev.SB_RDENVIRONMENT (this.pReference, this.pMap, pClient);
   }
}

MV.MVRP.Dev.SB_RDENVIRONMENT.apAction = {};

MV.MVRP.Dev.SB_RDENVIRONMENT.apAction['PRODUCTION'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (3 | ((65) << 16)),
   new MV.MVSB.MAP
   ({
      twRDEnvironmentIx                : MV.MVSB.MAP.FIELD.TWORD8,
      abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (8),
      pProduction                      :
      {
         bProduction                   : MV.MVSB.MAP.FIELD.BYTE,
         abReserved_A                  : MV.MVSB.MAP.FIELD.PAD (7),
      },
   })
);

MV.MVRP.Dev.SB_RDENVIRONMENT.apAction['NAME'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (4 | ((65) << 16)),
   new MV.MVSB.MAP
   ({
      twRDEnvironmentIx                : MV.MVSB.MAP.FIELD.TWORD8,
      abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (8),
      pName                            : MV.MVRP.Dev.Class.RDENVIRONMENT_NAME.MAP,
   })
);

MV.MVRP.Dev.SB_RDENVIRONMENT.apAction['CONFIGURE'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (5 | ((65) << 16)),
   new MV.MVSB.MAP
   ({
      twRDEnvironmentIx                : MV.MVSB.MAP.FIELD.TWORD8,
      abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (8),
      pConfig                          : MV.MVRP.Dev.Class.RDENVIRONMENT_CONFIG.MAP,
   })
);

MV.MVRP.Dev.SB_RDENVIRONMENT.apAction['PASSWORD'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (6 | ((65) << 16)),
   new MV.MVSB.MAP
   ({
      twRDEnvironmentIx                : MV.MVSB.MAP.FIELD.TWORD8,
      abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (8),
   }),
   new MV.MVSB.MAP
   ({
      sPassword                        : MV.MVSB.MAP.FIELD.STRING (64),
   })
);

MV.MVRP.Dev.SB_RDENVIRONMENT.apAction['IPADDRESS_OPEN'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (7 | ((65) << 16)),
   new MV.MVSB.MAP
   ({
      twRDEnvironmentIx                : MV.MVSB.MAP.FIELD.TWORD8,
      abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (8),
      dwIPAddressIz                    : MV.MVSB.MAP.FIELD.DWORD,
      dwIPAddress_WAN                  : MV.MVSB.MAP.FIELD.DWORD,
   })
);

MV.MVRP.Dev.SB_RDENVIRONMENT.apAction['IPADDRESS_CLOSE'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (8 | ((65) << 16)),
   new MV.MVSB.MAP
   ({
      twRDEnvironmentIx                : MV.MVSB.MAP.FIELD.TWORD8,
      abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (8),
      dwIPAddressIz                    : MV.MVSB.MAP.FIELD.DWORD,
      abReserved_B                     : MV.MVSB.MAP.FIELD.PAD (4),
   })
);

MV.MVRP.Dev.SB_RDENVIRONMENT.apAction['IPADDRESS_PAUSE'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (9 | ((65) << 16)),
   new MV.MVSB.MAP
   ({
      twRDEnvironmentIx                : MV.MVSB.MAP.FIELD.TWORD8,
      abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (8),
      dwIPAddressIz                    : MV.MVSB.MAP.FIELD.DWORD,
      abReserved_B                     : MV.MVSB.MAP.FIELD.PAD (4),
   })
);

MV.MVRP.Dev.SB_RDENVIRONMENT.apAction['IPADDRESS_CONTINUE'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (10 | ((65) << 16)),
   new MV.MVSB.MAP
   ({
      twRDEnvironmentIx                : MV.MVSB.MAP.FIELD.TWORD8,
      abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (8),
      dwIPAddressIz                    : MV.MVSB.MAP.FIELD.DWORD,
      abReserved_B                     : MV.MVSB.MAP.FIELD.PAD (4),
   })
);

MV.MVRP.Dev.SB_RDENVIRONMENT.apAction['AUTHENTICATE'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (14 | ((65) << 16)),
   new MV.MVSB.MAP
   ({
      twRDEnvironmentIx                : MV.MVSB.MAP.FIELD.TWORD8,
      twRDUserIx                       : MV.MVSB.MAP.FIELD.TWORD8,
   })
);

MV.MVRP.Dev.SB_RDENVIRONMENT.apAction['NOTIFICATION'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (20 | ((65) << 16)),
   new MV.MVSB.MAP
   ({
      abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (24),
      Target_twNotificationIx          : MV.MVSB.MAP.FIELD.TWORD8,
      Target_twRPersonaIx              : MV.MVSB.MAP.FIELD.TWORD8,
      abReserved_B                     : MV.MVSB.MAP.FIELD.PAD (14),
      wLength                          : MV.MVSB.MAP.FIELD.WORD,

                                         wSize_VarSize: [MV.MVSB.MAP.FIELD.eTYPE.SIZE, 0, "VarSize"],

      abData                           : [ MV.MVSB.MAP.FIELD.STRING (1), 8000, 'wLength' ]
   })
);

MV.MVRP.Dev.SB_RDENVIRONMENT.apAction['NOTIFICATION_CANCEL'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (21 | ((65) << 16)),
   new MV.MVSB.MAP
   ({
      abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (24),
      Target_twNotificationIx          : MV.MVSB.MAP.FIELD.TWORD8,
      Target_twRPersonaIx              : MV.MVSB.MAP.FIELD.TWORD8,
      abReserved_B                     : MV.MVSB.MAP.FIELD.PAD (8)
   })
);

MV.MVRP.Dev.SB_RDENVIRONMENT.apAction['NOTIFICATION_READ'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (22 | ((65) << 16)),
   new MV.MVSB.MAP
   ({
      abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (8),
      Origin_twRDServiceIx             : MV.MVSB.MAP.FIELD.TWORD8,
      Origin_twRDEnvironmentIx         : MV.MVSB.MAP.FIELD.TWORD8,
      Target_twNotificationIx          : MV.MVSB.MAP.FIELD.TWORD8,
      Target_twRPersonaIx              : MV.MVSB.MAP.FIELD.TWORD8,
      abReserved_B                     : MV.MVSB.MAP.FIELD.PAD (8)
   })
);

MV.MVRP.Dev.SB_RDENVIRONMENT.apAction['NOTIFICATION_ACTION'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (23 | ((65) << 16)),
   new MV.MVSB.MAP
   ({
      abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (8),
      Origin_twRDServiceIx             : MV.MVSB.MAP.FIELD.TWORD8,
      Origin_twRDEnvironmentIx         : MV.MVSB.MAP.FIELD.TWORD8,
      Target_twNotificationIx          : MV.MVSB.MAP.FIELD.TWORD8,
      Target_twRPersonaIx              : MV.MVSB.MAP.FIELD.TWORD8,
      abReserved_B                     : MV.MVSB.MAP.FIELD.PAD (14),
      wLength                          : MV.MVSB.MAP.FIELD.WORD,

                                         wSize_VarSize: [MV.MVSB.MAP.FIELD.eTYPE.SIZE, 0, "VarSize"],

      abData                           : [ MV.MVSB.MAP.FIELD.STRING (1), 8000, 'wLength' ]
   })
);

MV.MVRP.Dev.SB_RDENVIRONMENT.apAction['RPERSONA_IDENTIFY'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (15 | ((65) << 16)),
   new MV.MVSB.MAP
   ({
      twRDEnvironmentIx                : MV.MVSB.MAP.FIELD.TWORD8,
      dwIPAddress_WAN                  : MV.MVSB.MAP.FIELD.DWORD,
      abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (4),
      acToken64U_RP1                   : MV.MVSB.MAP.FIELD.STRING (64),
   }),
   new MV.MVSB.MAP
   ({
      twRPersonaIx                     : MV.MVSB.MAP.FIELD.TWORD8,
      pName                            : MV.MVRP.Class.RPERSONA_NAME.MAP,
      bGuest                           : MV.MVSB.MAP.FIELD.BYTE,
      abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (7)
   })
);

MV.MVRP.Dev.SB_RDENVIRONMENT.apAction['RPERSONA_NAME'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (16 | ((65) << 16)),
   new MV.MVSB.MAP
   ({
      twRDEnvironmentIx                : MV.MVSB.MAP.FIELD.TWORD8,
      twRPersonaIx                     : MV.MVSB.MAP.FIELD.TWORD8
   }),
   new MV.MVSB.MAP
   ({
      pName                            : MV.MVRP.Class.RPERSONA_NAME.MAP,
      bGuest                           : MV.MVSB.MAP.FIELD.BYTE,
      abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (7)
   })
);

MV.MVRP.Dev.SB_RDENVIRONMENT.apAction['RPERSONA_LOCATION'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (17 | ((65) << 16)),
   new MV.MVSB.MAP
   ({
      twRDEnvironmentIx                : MV.MVSB.MAP.FIELD.TWORD8,
      twRPersonaIx                     : MV.MVSB.MAP.FIELD.TWORD8
   }),
   new MV.MVSB.MAP
   ({
      pPosition                        : MV.MVRP.Class.POSITION_UNIVERSAL.MAP,
      pRotation                        : MV.MVRP.Class.ROTATION.MAP,
      abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (4)
   })
);

MV.MVRP.Dev.SB_RDENVIRONMENT.apAction['RPERSONA_MODIFIED'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (18 | ((65) << 16)),
   new MV.MVSB.MAP
   ({
      twRDEnvironmentIx                : MV.MVSB.MAP.FIELD.TWORD8,
      twRPersonaIx                     : MV.MVSB.MAP.FIELD.TWORD8
   })
);

MV.MVRP.Dev.SB_RDENVIRONMENT_IPADDRESS = class extends MV.MVSB.SB_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVSB',
         'RDEnvironment_IPAddress',

         66,

         MV.MVRP.Dev.SB_RDENVIRONMENT_IPADDRESS.apAction,

         false,

         new MV.MVSB.MAP
         ({
            bPaused           : MV.MVSB.MAP.FIELD.BYTE,
            abReserved_A      : MV.MVSB.MAP.FIELD.PAD (3),
            dwIPAddress_WAN   : MV.MVSB.MAP.FIELD.DWORD,

            abReserved_B      : MV.MVSB.MAP.FIELD.PAD (8),
         })
      );
   }

}

MV.MVRP.Dev.SB_RDENVIRONMENT_IPADDRESS.FACTORY = class extends MV.MVSB.SB_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Dev.SB_RDENVIRONMENT_IPADDRESS (this.pReference, this.pMap, pClient);
   }
}

MV.MVRP.Dev.SB_RDENVIRONMENT_SESSION = class extends MV.MVSB.SB_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVSB',
         'RDEnvironment_Session',

         68,

         MV.MVRP.Dev.SB_RDENVIRONMENT_SESSION.apAction,

         false,

         new MV.MVSB.MAP
         ({
            wLoginIz          : MV.MVSB.MAP.FIELD.WORD,
            abReserved_A      : MV.MVSB.MAP.FIELD.PAD (2),
            dwIPAddress_WAN   : MV.MVSB.MAP.FIELD.DWORD,
            abReserved_B      : MV.MVSB.MAP.FIELD.PAD (24),
            qwClientSessionIx : MV.MVSB.MAP.FIELD.QWORD,
            abReserved_C      : MV.MVSB.MAP.FIELD.PAD (8),
         })
      );
   }

}

MV.MVRP.Dev.SB_RDENVIRONMENT_SESSION.FACTORY = class extends MV.MVSB.SB_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Dev.SB_RDENVIRONMENT_SESSION (this.pReference, this.pMap, pClient);
   }
}

MV.MVRP.Dev.SB_RDACTIVITY = class extends MV.MVSB.SB_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVSB',
         'RDActivity',

         69,

         MV.MVRP.Dev.SB_RDACTIVITY.apAction,

         true,

         new MV.MVSB.MAP
         ({
            sGUId          : MV.MVSB.MAP.FIELD.STRING (40),
            abReserved_A   : MV.MVSB.MAP.FIELD.PAD (8),
            pName          : MV.MVRP.Dev.Class.RDACTIVITY_NAME.MAP,

                             wSize_Partial: [MV.MVSB.MAP.FIELD.eTYPE.SIZE, 0, "Partial"]
         })
      );
   }

}

MV.MVRP.Dev.SB_RDACTIVITY.FACTORY = class extends MV.MVSB.SB_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Dev.SB_RDACTIVITY (this.pReference, this.pMap, pClient);
   }
}

MV.MVRP.Dev.SB_RDACTIVITY.apAction = {};

MV.MVRP.Dev.SB_RDACTIVITY.apAction['NAME'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (1 | ((69) << 16)),
   new MV.MVSB.MAP
   ({
      twRDActivityIx    : MV.MVSB.MAP.FIELD.TWORD8,
      abReserved_A      : MV.MVSB.MAP.FIELD.PAD (8),
      pName             : MV.MVRP.Dev.Class.RDACTIVITY_NAME.MAP,
   }),
   new MV.MVSB.MAP
   ({
   })
);

MV.MVRP.Dev.SB_RDFABRIC = class extends MV.MVSB.SB_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVSB',
         'RDFabric',

         76,

         MV.MVRP.Dev.SB_RDFABRIC.apAction,

         true,

         new MV.MVSB.MAP
         ({
            sGUId             : MV.MVSB.MAP.FIELD.STRING (40),
            abReserved_A      : MV.MVSB.MAP.FIELD.PAD (6),
            bPaused           : MV.MVSB.MAP.FIELD.BYTE,
            bAuthenticated    : MV.MVSB.MAP.FIELD.BYTE,
            pName             : MV.MVRP.Dev.Class.RDFABRIC_NAME.MAP,
            pPath             : MV.MVRP.Dev.Class.RDFABRIC_PATH.MAP,

                                wSize_Partial: [MV.MVSB.MAP.FIELD.eTYPE.SIZE, 0, "Partial"]
         })
      );
   }

}

MV.MVRP.Dev.SB_RDFABRIC.FACTORY = class extends MV.MVSB.SB_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Dev.SB_RDFABRIC (this.pReference, this.pMap, pClient);
   }
}

MV.MVRP.Dev.SB_RDFABRIC.apAction =
{
   NAME                 : new MV.MVSB.SERVICE.CLIENT.ACTION
                        (
                           (3 | ((76) << 16)),
                           new MV.MVSB.MAP
                           ({
                              twRDFabricIx      : MV.MVSB.MAP.FIELD.TWORD8,
                              abReserved_A      : MV.MVSB.MAP.FIELD.PAD (8),
                              pName             : MV.MVRP.Dev.Class.RDFABRIC_NAME.MAP,
                           })
                        ),
   CONFIGURE            : new MV.MVSB.SERVICE.CLIENT.ACTION
                        (
                           (4 | ((76) << 16)),
                           new MV.MVSB.MAP
                           ({
                              twRDFabricIx      : MV.MVSB.MAP.FIELD.TWORD8,
                              abReserved_A      : MV.MVSB.MAP.FIELD.PAD (16),
                              pConfig           : MV.MVRP.Dev.Class.RDFABRIC_CONFIG.MAP,
                              abReserved_B      : MV.MVSB.MAP.FIELD.PAD (16)
                           })
                        )
};

MV.MVRP.Dev.SESSION_RP1 = class extends MV.MVMF.MODEL_SESSION
{
   static factory ()
   {
      return new this.FACTORY ('Session_RP1');
   }

   static eSTATE =
   {
      LOGGEDOUT : 0,
      LOGGING   : 1,
      LOGGEDIN  : 2,
   };

   eSTATE = MV.MVRP.Dev.SESSION_RP1.eSTATE;

   constructor (pReference, pSource_Session)
   {
      super (pReference, pSource_Session);

      this.dwResult = 0;

      if (pReference.bAutoConnect === false)
         this.pSource.bAutoConnect = false;
   }

   get pLogin () { return this.pSource.pLogin; }

   Progress (pProgress)
   {
      this.Emit ('onProgress', pProgress);
   }

   Loggedout ()
   {
      this.pSource.Logout ();
   }

   IsLoggedOut ()
   {
      return (this.ReadyState () == this.eSTATE.LOGGEDOUT  &&  this.pSource.IsConnected ());
   }

   IsLoggedIn ()
   {
      return (this.ReadyState () == this.eSTATE.LOGGEDIN);
   }

   Connect ()
   {
      return this.pSource.Connect ();
   }

   Disconnect (bVoluntary)
   {
      return this.pSource.Disconnect (bVoluntary);
   }

   Login (sSession)
   {
      let pSession = MV.MVMF.Decode (sSession);

      return this.pSource.Login (pSession.token);
   }

   Logout ()
   {
      return this.pSource.Logout ();
   }
}

MV.MVRP.Dev.SESSION_RP1.FACTORY = class extends MV.MVMF.MODEL_SESSION.FACTORY
{

   Reference (asArgs)
   {
      let bAutoConnect = (asArgs[0] == 'false') ? false : true;

      return new MV.MVRP.Dev.SESSION_RP1.IREFERENCE (this.sID, bAutoConnect);
   }
}

MV.MVRP.Dev.SESSION_RP1.IREFERENCE = class extends MV.MVMF.MODEL_SESSION.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVRP.Dev.SESSION_RP1 (this, pSource);
   }
}

MV.MVRP.Dev.RDROOT = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('RDRoot');
   }

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twRDRootIx = pReference.twObjectIx;
   }

   Request (sAction)
   {
      let pIAction = super.Request (sAction);
      if (pIAction)
      {
         let pRequest = pIAction.pRequest;

         if ('twRDRootIx' in pRequest)
            pRequest.twRDRootIx = this.twRDRootIx;
      }

      return pIAction;
   }
}

MV.MVRP.Dev.RDROOT.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRDRootIx = Number (asArgs[0]);

      return new MV.MVRP.Dev.RDROOT.IREFERENCE (this.sID, twRDRootIx);
   }
}

MV.MVRP.Dev.RDROOT.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVRP.Dev.RDROOT (this, pSource);
   }
}

MV.MVRP.Dev.RDUSER = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('RDUser');
   }

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twRDUserIx = pReference.twObjectIx;
   }

   Request (sAction)
   {
      let pIAction = super.Request (sAction);
      if (pIAction)
      {
         let pRequest = pIAction.pRequest;

         if ('twRDUserIx' in pRequest)
            pRequest.twRDUserIx = this.twRDUserIx;
      }

      return pIAction;
   }
}

MV.MVRP.Dev.RDUSER.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRDUserIx = Number (asArgs[0]);

      return new MV.MVRP.Dev.RDUSER.IREFERENCE (this.sID, twRDUserIx);
   }
}

MV.MVRP.Dev.RDUSER.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVRP.Dev.RDUSER (this, pSource);
   }
}

MV.MVRP.Dev.RDUSER_RDCOMPANY = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('RDUser_RDCompany');
   }

   static eSTATE =
   {
      BLOCKED       : 0,
      INVITED       : 1,
      ACCEPTED      : 2,
   }
   eSTATE = MV.MVRP.Dev.RDUSER_RDCOMPANY.eSTATE;

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twRDUserIx    = pReference.twObjectIx;
      this.twRDCompanyIx = pReference.twChildIx;

      this.pName = new MV.MVRP.Dev.Class.RDCOMPANY_NAME ();
   }

   destructor ()
   {
      this.pName = this.pName.destructor ();

      return super.destructor ();
   }

   Request (sAction)
   {
      let pIAction = super.Request (sAction);
      if (pIAction)
      {
         let pRequest = pIAction.pRequest;

         if ('twRDCompanyIx' in pRequest)
            pRequest.twRDCompanyIx = this.twRDCompanyIx;
         if ('twRDUserIx' in pRequest)
            pRequest.twRDUserIx = this.twRDUserIx;
      }

      return pIAction;
   }
}

MV.MVRP.Dev.RDUSER_RDCOMPANY.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRDUserIx    = Number (asArgs[0]);
      let twRDCompanyIx = Number (asArgs[1]);

      return new MV.MVRP.Dev.RDUSER_RDCOMPANY.IREFERENCE (this.sID, twRDUserIx, twRDCompanyIx);
   }
}

MV.MVRP.Dev.RDUSER_RDCOMPANY.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVRP.Dev.RDUSER_RDCOMPANY (this, pSource);
   }
}

MV.MVRP.Dev.RDCOMPANY = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('RDCompany');
   }

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twRDCompanyIx = pReference.twObjectIx;

      this.pName            = new MV.MVRP.Dev.Class.RDCOMPANY_NAME    ();
      this.pEntity          = new MV.MVRP.Dev.Class.RDCOMPANY_ENTITY  ();
      this.pAddress_Office  = new MV.MVRP.Dev.Class.RDCOMPANY_ADDRESS ();
      this.pAddress_Mailing = new MV.MVRP.Dev.Class.RDCOMPANY_ADDRESS ();
      this.pAmin            = new MV.MVRP.Dev.Class.RDCOMPANY_ADMIN   ();
   }

   destructor ()
   {
      this.pName            = this.pName           .destructor ();
      this.pEntity          = this.pEntity         .destructor ();
      this.pAddress_Office  = this.pAddress_Office .destructor ();
      this.pAddress_Mailing = this.pAddress_Mailing.destructor ();
      this.pAmin            = this.pAmin           .destructor ();

      return super.destructor ();
   }

   Request (sAction)
   {
      let pIAction = super.Request (sAction);
      if (pIAction)
      {
         let pRequest = pIAction.pRequest;

         if ('twRDCompanyIx' in pRequest)
            pRequest.twRDCompanyIx = this.twRDCompanyIx;
      }

      return pIAction;
   }
}

MV.MVRP.Dev.RDCOMPANY.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRDCompanyIx = Number (asArgs[0]);

      return new MV.MVRP.Dev.RDCOMPANY.IREFERENCE (this.sID, twRDCompanyIx);
   }
}

MV.MVRP.Dev.RDCOMPANY.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVRP.Dev.RDCOMPANY (this, pSource);
   }
}

MV.MVRP.Dev.RDCOMPANY_RPERSONA = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('RDCompany_RPersona');
   }

   static eRIGHTS =
   {
      COMPANY             :
      {
         SETTINGS_VIEW    : 0x00000001,
         SETTINGS_MODIFY  : 0x00000002,
         RPERSONA_VIEW    : 0x00000010,
         RPERSONA_INVITE  : 0x00000020,
         RPERSONA_DELETE  : 0x00000040,
         RPERSONA_RIGHTS  : 0x00000080,
         RPERSONA_DISABLE : 0x00000100,
         SERVICE_OPEN     : 0x00001000,
         SERVICE_CLOSE    : 0x00002000,
         ACTIVITY_OPEN    : 0x00010000,
         ACTIVITY_CLOSE   : 0x00020000,
         FABRIC_OPEN      : 0x00100000,
         FABRIC_CLOSE     : 0x00200000,
         FABRIC_MODIFY    : 0x00400000,
         PROTECTED        : 0x40000000,
         DISABLED         : 0x80000000,
      },

      SERVICE             :
      {
         MODIFY           : 0x00000001,
      },

      ACTIVITY:
      {
         MODIFY           : 0x00000001,
      }
   };

   eRIGHTS = MV.MVRP.Dev.RDCOMPANY_RPERSONA.eRIGHTS;

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twRDCompanyIx = pReference.twObjectIx;
      this.twRPersonaIx  = pReference.twChildIx;

      this.pName = new MV.MVRP.Class.RPERSONA_NAME ();
   }

   destructor ()
   {
      this.pName = this.pName.destructor ();

      return super.destructor ();
   }

   Request (sAction)
   {
      let pIAction = super.Request (sAction);
      if (pIAction)
      {
         let pRequest = pIAction.pRequest;

         if ('twRDCompanyIx' in pRequest)
            pRequest.twRDCompanyIx = this.twRDCompanyIx;
         if ('twRPersonaIx' in pRequest)
            pRequest.twRPersonaIx = this.twRPersonaIx;
      }

      return pIAction;
   }

   GetName ()
   {

      let sResult = this.pName.wsForename;

      if (this.pName.wsSurname != '')
         sResult += '.' + this.pName.wsSurname;
      if (this.pName.dwSequence != 0)
         sResult += '.' + this.pName.dwSequence;

      return sResult;
   }
}

MV.MVRP.Dev.RDCOMPANY_RPERSONA.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRDCompanyIx = Number (asArgs[0]);
      let twRPersonaIx  = Number (asArgs[1]);

      return new MV.MVRP.Dev.RDCOMPANY_RPERSONA.IREFERENCE (this.sID, twRDCompanyIx, twRPersonaIx);
   }
}

MV.MVRP.Dev.RDCOMPANY_RPERSONA.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVRP.Dev.RDCOMPANY_RPERSONA (this, pSource);
   }
}

MV.MVRP.Dev.RDSERVICE = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('RDService');
   }

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twRDServiceIx = pReference.twObjectIx;

      this.pName = new MV.MVRP.Dev.Class.RDSERVICE_NAME   ();
   }

   destructor ()
   {
      this.pName = this.pName.destructor ();

      return super.destructor ();
   }

   Request (sAction)
   {
      let pIAction = super.Request (sAction);
      if (pIAction)
      {
         let pRequest = pIAction.pRequest;

         if ('twRDServiceIx' in pRequest)
            pRequest.twRDServiceIx = this.twRDServiceIx;
      }

      return pIAction;
   }
}

MV.MVRP.Dev.RDSERVICE.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRDServiceIx = Number (asArgs[0]);

      return new MV.MVRP.Dev.RDSERVICE.IREFERENCE (this.sID, twRDServiceIx);
   }
}

MV.MVRP.Dev.RDSERVICE.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVRP.Dev.RDSERVICE (this, pSource);
   }
}

MV.MVRP.Dev.RDENVIRONMENT = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('RDEnvironment');
   }

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twRDEnvironmentIx = pReference.twObjectIx;

      this.pName   = new MV.MVRP.Dev.Class.RDENVIRONMENT_NAME   ();
      this.pConfig = new MV.MVRP.Dev.Class.RDENVIRONMENT_CONFIG ();
   }

   destructor ()
   {
      this.pName   = this.pName  .destructor ();
      this.pConfig = this.pConfig.destructor ();

      return super.destructor ();
   }

   Request (sAction)
   {
      let pIAction = super.Request (sAction);
      if (pIAction)
      {
         let pRequest = pIAction.pRequest;

         if ('twRDEnvironmentIx' in pRequest)
            pRequest.twRDEnvironmentIx = this.twRDEnvironmentIx;
      }

      return pIAction;
   }
}

MV.MVRP.Dev.RDENVIRONMENT.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRDEnvironmentIx = Number (asArgs[0]);

      return new MV.MVRP.Dev.RDENVIRONMENT.IREFERENCE (this.sID, twRDEnvironmentIx);
   }
}

MV.MVRP.Dev.RDENVIRONMENT.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVRP.Dev.RDENVIRONMENT (this, pSource);
   }
}

MV.MVRP.Dev.RDENVIRONMENT_IPADDRESS = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('RDEnvironment_IPAddress');
   }

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twRDEnvironmentIx = pReference.twObjectIx;
      this.dwIPAddressIz     = pReference.twChildIx;
   }
}

MV.MVRP.Dev.RDENVIRONMENT_IPADDRESS.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRDEnvironmentIx = Number (asArgs[0]);
      let dwIPAddressIz     = Number (asArgs[1]);

      return new MV.MVRP.Dev.RDENVIRONMENT_IPADDRESS.IREFERENCE (this.sID, twRDEnvironmentIx, dwIPAddressIz);
   }
}

MV.MVRP.Dev.RDENVIRONMENT_IPADDRESS.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVRP.Dev.RDENVIRONMENT_IPADDRESS (this, pSource);
   }
}

MV.MVRP.Dev.RDENVIRONMENT_SESSION = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('RDEnvironment_Session');
   }

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twRDEnvironmentIx = pReference.twObjectIx;
      this.twSessionIz       = pReference.twChildIx;
   }
}

MV.MVRP.Dev.RDENVIRONMENT_SESSION.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRDEnvironmentIx = Number (asArgs[0]);
      let twSessionIz       = Number (asArgs[1]);

      return new MV.MVRP.Dev.RDENVIRONMENT_SESSION.IREFERENCE (this.sID, twRDEnvironmentIx, twSessionIz);
   }
}

MV.MVRP.Dev.RDENVIRONMENT_SESSION.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVRP.Dev.RDENVIRONMENT_SESSION (this, pSource);
   }
}

MV.MVRP.Dev.RDACTIVITY = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('RDActivity');
   }

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twRDActivityIx = pReference.twObjectIx;

      this.pName = new MV.MVRP.Dev.Class.RDACTIVITY_NAME ();
   }

   destructor ()
   {
      this.pName = this.pName.destructor ();

      return super.destructor ();
   }

   Request (sAction)
   {
      let pIAction = super.Request (sAction);
      if (pIAction)
      {
         let pRequest = pIAction.pRequest;

         if ('twRDActivityIx' in pRequest)
            pRequest.twRDActivityIx = this.twRDActivityIx;
      }

      return pIAction;
   }
}

MV.MVRP.Dev.RDACTIVITY.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRDActivityIx = Number (asArgs[0]);

      return new MV.MVRP.Dev.RDACTIVITY.IREFERENCE (this.sID, twRDActivityIx);
   }
}

MV.MVRP.Dev.RDACTIVITY.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVRP.Dev.RDACTIVITY (this, pSource);
   }
}

MV.MVRP.Dev.RDFABRIC = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('RDFabric');
   }

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twRDFabricIx = pReference.twObjectIx;

      this.pName     = new MV.MVRP.Dev.Class.RDFABRIC_NAME ();
      this.pPath     = new MV.MVRP.Dev.Class.RDFABRIC_PATH ();
   }

   destructor ()
   {
      this.pName     = this.pName.destructor ();
      this.pPath     = this.pPath.destructor ();

      return super.destructor ();
   }

   Request (sAction)
   {
      let pIAction = super.Request (sAction);
      if (pIAction)
      {
         let pRequest = pIAction.pRequest;

         if ('twRDFabricIx' in pRequest)
            pRequest.twRDFabricIx = this.twRDFabricIx;
      }

      return pIAction;
   }
}

MV.MVRP.Dev.RDFABRIC.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRDFabricIx = Number (asArgs[0]);

      return new MV.MVRP.Dev.RDFABRIC.IREFERENCE (this.sID, twRDFabricIx);
   }
}

MV.MVRP.Dev.RDFABRIC.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVRP.Dev.RDFABRIC (this, pSource);
   }
}

MV.MVRP.Dev.Package.DEV = class extends MV.MVMF.PLUGIN.PACKAGE
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVSB',
         'Dev',

         {
            aService  : [
                        ],
            aModel    : [
                           'MVRP_Dev/RDRoot',
                           'MVRP_Dev/RDUser',
                           'MVRP_Dev/RDUser_RDCompany',
                           'MVRP_Dev/RDCompany',
                           'MVRP_Dev/RDCompany_RPersona',
                           'MVRP_Dev/RDService',
                           'MVRP_Dev/RDEnvironment',
                           'MVRP_Dev/RDEnvironment_IPAddress',
                           'MVRP_Dev/RDEnvironment_Session',
                           'MVRP_Dev/RDActivity',
                           'MVRP_Dev/RDFabric',
                        ],
            aSource   : [
                           'MVRP_Dev/MVSB:RDRoot',
                           'MVRP_Dev/MVSB:RDUser',
                           'MVRP_Dev/MVSB:RDUser_RDCompany',
                           'MVRP_Dev/MVSB:RDCompany',
                           'MVRP_Dev/MVSB:RDCompany_RPersona',
                           'MVRP_Dev/MVSB:RDService',
                           'MVRP_Dev/MVSB:RDEnvironment',
                           'MVRP_Dev/MVSB:RDEnvironment_IPAddress',
                           'MVRP_Dev/MVSB:RDEnvironment_Session',
                           'MVRP_Dev/MVSB:RDActivity',
                           'MVRP_Dev/MVSB:RDFabric',
                        ]
         }
      );
   }

}

MV.MVRP.Dev.Package.DEV.FACTORY = class extends MV.MVMF.PLUGIN.PACKAGE.FACTORY
{

   Reference (sNamespace)
   {
      return new MV.MVRP.Dev.Package.DEV.IREFERENCE (this.sID, sNamespace, this.pConfig);
   }
}

MV.MVRP.Dev.Package.DEV.IREFERENCE = class extends MV.MVMF.PLUGIN.PACKAGE.IREFERENCE
{

   Create (pParam)
   {
      return new MV.MVRP.Dev.Package.DEV (this, pParam);
   }
}

MV.MVRP.Dev.Install = function (pCore, pPlugin)
{
   let bResult = true;

   if (this.pRequire = pCore.Require ('MVRP,MVIO,MVRest'))
   {
      this.apFactory_Model =
      [
         MV.MVRP.Dev.SESSION_RP1               .factory (),

         MV.MVRP.Dev.RDROOT                    .factory (),
         MV.MVRP.Dev.RDUSER                    .factory (),
         MV.MVRP.Dev.RDUSER_RDCOMPANY          .factory (),
         MV.MVRP.Dev.RDCOMPANY                 .factory (),
         MV.MVRP.Dev.RDCOMPANY_RPERSONA        .factory (),
         MV.MVRP.Dev.RDSERVICE                 .factory (),
         MV.MVRP.Dev.RDENVIRONMENT             .factory (),
         MV.MVRP.Dev.RDENVIRONMENT_IPADDRESS   .factory (),
         MV.MVRP.Dev.RDENVIRONMENT_SESSION     .factory (),
         MV.MVRP.Dev.RDACTIVITY                .factory (),
         MV.MVRP.Dev.RDFABRIC                  .factory (),
      ];

      this.apFactory_Source =
      [
         MV.MVRP.Dev.IO_SESSION_RP1            .factory (),
         MV.MVRP.Dev.REST_SESSION_RP1          .factory (),

         MV.MVRP.Dev.SB_RDROOT                 .factory (),
         MV.MVRP.Dev.SB_RDUSER                 .factory (),
         MV.MVRP.Dev.SB_RDUSER_RDCOMPANY       .factory (),
         MV.MVRP.Dev.SB_RDCOMPANY              .factory (),
         MV.MVRP.Dev.SB_RDCOMPANY_RPERSONA     .factory (),
         MV.MVRP.Dev.SB_RDSERVICE              .factory (),
         MV.MVRP.Dev.SB_RDENVIRONMENT          .factory (),
         MV.MVRP.Dev.SB_RDENVIRONMENT_IPADDRESS.factory (),
         MV.MVRP.Dev.SB_RDENVIRONMENT_SESSION  .factory (),
         MV.MVRP.Dev.SB_RDACTIVITY             .factory (),
         MV.MVRP.Dev.SB_RDFABRIC               .factory (),
      ];

      this.apFactory_Package =
      [
         MV.MVRP.Dev.Package.DEV               .factory ()
      ];

      pPlugin.Factory_Models   (this.apFactory_Model);
      pPlugin.Factory_Sources  (this.apFactory_Source);
      pPlugin.Factory_Packages (this.apFactory_Package);
   }
   else bResult = false;

   return bResult;
}

MV.MVRP.Dev.Unstall = function (pCore, pPlugin)
{
   let n;

   if (this.pRequire)
   {
      for (n=0; n<this.apFactory_Model.length; n++)
         this.apFactory_Model[n] = this.apFactory_Model[n].destructor ();

      for (n=0; n<this.apFactory_Source.length; n++)
         this.apFactory_Source[n] = this.apFactory_Source[n].destructor ();

      for (n=0; n<this.apFactory_Package.length; n++)
         this.apFactory_Package[n] = this.apFactory_Package[n].destructor ();

      this.pRequire = pCore.Release (this.pRequire);
   }
}

