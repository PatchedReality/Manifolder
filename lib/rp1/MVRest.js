
/*
import { MV } from '@metaversalcorp/mvmf'
*/
/*
const { MV } = require ('@metaversalcorp/mvmf');
*/

MV.MVRest = MV.Library ('MVRest', 'Copyright 2014-2024 Metaversal Corporation. All rights reserved.', 'Metaversal Rest Service', '0.23.5');

MV.MVRest.SERVICE = class extends MV.MVMF.SERVICE
{
   static factory ()
   {
      return new this.FACTORY ('MVRest');
   }

   #pNetSettings;

   constructor (pReference, pNamespace)
   {
      super (pReference, pNamespace);

      this.#pNetSettings = pReference.pNetSettings;
   }

   get pNetSettings () { return this.#pNetSettings; }

   Client_Open (twClientIx)
   {
      return super.Client_Open (MV.MVRest.SERVICE.CLIENT.Reference (twClientIx));
   }

   Client_Close (pClient)
   {
      return super.Client_Close (pClient);
   }
}

MV.MVRest.SERVICE.FACTORY = class extends MV.MVMF.SERVICE.FACTORY
{

   Reference (sConnect)
   {
      return new MV.MVRest.SERVICE.IREFERENCE (this.sID, sConnect);
   }
}

MV.MVRest.SERVICE.IREFERENCE = class extends MV.MVMF.SERVICE.IREFERENCE
{
   constructor (sID, sConnect)
   {
      super (sID, sConnect);

      this.pNetSettings =
      {
         bSecure  : this.bSecure,
         sHost    : this.sHost,
         wPort    : this.wPort,
         sSession : this.pConnect.session
      };
   }

   Key ()
   {
      return this.pNetSettings.bSecure + ';' + this.pNetSettings.sHost + ';' + this.pNetSettings.wPort + ';' + this.pNetSettings.sSession;
   }

   Create (pNamespace)
   {
      return new MV.MVRest.SERVICE (this, pNamespace);
   }
}

MV.MVRest.SERVICE.CLIENT = class extends MV.MVMF.CLIENT
{
   static sID = 'MVRest';

   static eSTATE =
   {
      LOGGEDOUT        : 0,
      LOGGING          : 1,
      LOGGEDIN         : 2,
   };

   static ePROGRESS =
   {
      LOGIN_ATTEMPT    : 0,
      LOGIN_RESULT     : 1,
      LOGOUT_ATTEMPT   : 2,
      LOGOUT_RESULT    : 3,
   };

   sID       = MV.MVRest.SERVICE.CLIENT.sID;
   eSTATE    = MV.MVRest.SERVICE.CLIENT.eSTATE;
   ePROGRESS = MV.MVRest.SERVICE.CLIENT.ePROGRESS;

   #pControl;
   #m_nCount;

   pObjectHead = new MV.MVRest.REST_OBJECT.OBJECTHEAD ();

   constructor (pReference, pService)
   {
      super (pReference, pService);

      this.#m_nCount = 0;

      this.#pControl = new MV.MVRest.SERVICE.CLIENT.CONTROL (this, this.pService.pNetSettings);
   }

   destructor ()
   {
      this.#pControl = this.#pControl.destructor ();

      return super.destructor ();
   }

   static Reference (twClientIx)
   {
      return new MV.MVRest.SERVICE.CLIENT.IREFERENCE (twClientIx);
   }

   get bLoggedIn () { return this.#pControl.bLoggedIn; }
   get pLogin    () { return this.#pControl.pLogin;    }
   get sEndPoint () { return this.#pControl.sEndPoint; }

   Progress (pProgress)
   {
      let pSource = this.Source (0);

      if (pSource)
         pSource.Progress (pProgress);
   }

   IsConnected ()
   {
      return true;
   }

   IsDisconnected ()
   {
      return false;
   }

   Inc ()
   {
      this.#m_nCount++;
   }

   Dec ()
   {
      this.#m_nCount--;
   }

   SafeKill ()
   {

      return (this.#m_nCount == 0);
   }

   Login  (pParams) { return this.#pControl.Login  (this.Source (0), pParams); }
   Logout (pParams) { return this.#pControl.Logout (this.Source (0), pParams); }

   Request (pAction)
   {
      return new MV.MVRest.SERVICE.CLIENT.IACTION (this, pAction);
   }

   Object_Recover (pData)
   {
      let dwResult = 0;

      this.pObjectHead.twParentIx    = pData.pObjectHead.twParentIx;
      this.pObjectHead.twObjectIx    = pData.pObjectHead.twObjectIx;
      this.pObjectHead.wClass_Parent = pData.pObjectHead.wClass_Parent;
      this.pObjectHead.wClass_Object = pData.pObjectHead.wClass_Object;
      this.pObjectHead.wFlags        = pData.pObjectHead.wFlags;
      this.pObjectHead.twEventIz     = pData.pObjectHead.twEventIz;

      {
         this.pMem.Object_Update
         (
            this.pObjectHead,
            this,
            function (pObject, bDiscard)
            {
               pObject.Map_Write (pData, this.pObjectHead.bFlags, bDiscard);

               return true;
            }
         );
      }

      return dwResult;
   }
}

MV.MVRest.SERVICE.CLIENT.IREFERENCE = class extends MV.MVMF.SHAREDOBJECT.IREFERENCE
{
   constructor (twClientIx)
   {
      super (MV.MVRest.SERVICE.CLIENT.sID);

      this.twClientIx = twClientIx;
   }

   Key ()
   {
      return this.twClientIx;
   }

   Create (pService)
   {
      return new MV.MVRest.SERVICE.CLIENT (this, pService)
   }
}

MV.MVRest.SERVICE.CLIENT.ACTION = class
{
   constructor (sAction, pRequest, pMap)
   {
      this.sAction  = sAction;
      this.pRequest = pRequest;
      this.pMap     = pMap;
   }
}

MV.MVRest.SERVICE.CLIENT.IACTION = class
{
   #pClient;
   #pAction;

   #pRequest;
   #pResponse;

   #pThis       = null;
   #fnResponse  = null;
   #pParam      = null;
   #pXHR        = null;

   sAction;
   dwResult;

   constructor (pClient, pAction)
   {
      this.#pClient    = pClient;
      this.#pAction    = pAction;

      this.#pRequest   = { ... this.#pAction.pRequest };
      this.#pResponse  = null;
   }

   destructor ()
   {
      return null;
   }

   get pRequest  ()        { return this.#pRequest;   }
   get pResponse ()        { return this.#pResponse;  }

   Response ()
   {
      this.#fnResponse.call (this.#pThis, this, this.#pParam);
   }

   Send (pThis, fnResponse, pParam)
   {
      this.#pThis       = pThis;
      this.#fnResponse  = fnResponse;
      this.#pParam      = pParam;

      let ReadyStateChange = function (pXHR)
      {
         if (pXHR.readyState == 4)
         {
            this.#pClient.Dec ();

            if (this.#fnResponse)
            {
               this.#pResponse = {};

               if (pXHR.status == 200)
               {

                  this.#pAction.pMap.Decode (this, pXHR);
               }
               else
               {
                  console.log ("RECV Error: " + pXHR.statusText + " - " + pXHR.status);

                  this.#pAction.pMap.Error (this, pXHR);
               }
            }
         }
      }

      let pOptions = this.#pAction.pMap.Encode (this, this.#pAction.sAction, this.#pClient.pLogin);
      let sURL = (pOptions.sEndPoint ? pOptions.sEndPoint : this.#pClient.sEndPoint) + this.sAction;

      this.#pXHR = new XMLHttpRequest ();

      this.#pXHR.onreadystatechange = ReadyStateChange.bind (this, this.#pXHR);

      if (pOptions.sQuery)
         sURL += '?' + pOptions.sQuery;

      this.#pXHR.open (pOptions.method, sURL);

      for (let sHeader in pOptions.headers)
         this.#pXHR.setRequestHeader (sHeader, pOptions.headers[sHeader]);

      this.#pClient.Inc ();
      this.#pXHR.send (pOptions.body);
   }

   Abort ()
   {
      if (this.#pXHR)
      {
         this.#pXHR.abort ();

         this.#pXHR = null;
      }
   }

   GetResult ()
   {
      return this.dwResult;
   }

   IsSuccess ()
   {
      return (this.dwResult == 0);
   }
}

MV.MVRest.SERVICE.CLIENT.CONTROL = class
{
   #pClient;

   #eSTATE;
   #ePROGRESS;

   #bError;
   #dwResult;

   #sopModel;
   #apSource;

   #sEndPoint;

   #pSource;
   #pParams;
   #pLogin;
   #bLoggedIn;

   RESULT_SUCCESS         = 0;
   RESULT_TRANSMITFAILURE = -1000;

   constructor (pClient, pNetSettings)
   {
      this.#pClient           = pClient;

      this.#eSTATE            = pClient.eSTATE;
      this.#ePROGRESS         = pClient.ePROGRESS;

      this.#bError            = false;
      this.#dwResult           = this.RESULT_SUCCESS;

      this.#sEndPoint         = (pNetSettings.bSecure ? 'https://' : 'http://') + pNetSettings.sHost + ((pNetSettings.wPort && pNetSettings.wPort != 0) ? ':' + pNetSettings.wPort : '');
      if (this.#sEndPoint.slice (-1) != '/')
         this.#sEndPoint += '/';

      this.#pLogin            = null;
      this.#bLoggedIn         = false;
   }

   destructor ()
   {
      return null;
   }

   get bLoggedIn         () { return this.#bLoggedIn; }
   get pLogin            () { return this.#pLogin;    }
   get sEndPoint         () { return this.#sEndPoint  }

   #ReadyState (nState)
   {
      return this.#pClient.ReadyState (nState);
   }

   #Progress (pProgress)
   {
      return this.#pClient.Progress (pProgress);
   }

   #Request (sAction)
   {
      return this.#pClient.Request (MV.MVRest.SERVICE.CLIENT.CONTROL.#apAction[sAction]);
   }

   #Login_Request (bVoluntary)
   {
      let bExit = false;

      bVoluntary = (this.#bLoggedIn == false);

      if (this.#ReadyState () == this.#eSTATE.LOGGEDOUT)
      {
         this.ClearError ();

         this.#ReadyState (this.#eSTATE.LOGGING);

         this.#Progress ({ nProgress: this.#ePROGRESS.LOGIN_ATTEMPT, bVoluntary });

         let pIAction = this.#pSource.Login_Request (this.#pParams, this.#pLogin);

         if (pIAction)
         {
            if (pIAction.Send (this, this.#Login_Response, bVoluntary) != false)
            {
               bExit = true;
            }
            else this.#dwResult = this.RESULT_TRANSMITFAILURE;
         }
         else this.#dwResult = this.RESULT_TRANSMITFAILURE;

         if (bExit == false)
         {
            this.#Login_Exit (null, bVoluntary)
         }
      }
      else
      {
         this.#pSource = undefined;
         this.#pParams = undefined;
      }

      return bExit;
   }

   #Login_Response (pIAction, bVoluntary)
   {
      this.#dwResult = pIAction.pResponse.nResult;

      this.#Login_Exit (pIAction, bVoluntary);
   }

   #Login_Exit (pIAction, bVoluntary)
   {
      if (pIAction  &&  this.#dwResult == this.RESULT_SUCCESS)
      {
         if (this.#bLoggedIn == false)
         {
            this.#pLogin = {};
         }

         if (this.#pSource.Login_Response (this.#pParams, this.#pLogin, pIAction, bVoluntary) != false)
         {
            this.#pSource   = undefined;
            this.#pParams   = undefined;

            this.#bLoggedIn = true;

            this.#ReadyState (this.#eSTATE.LOGGEDIN);
         }
         else
         {
            this.#bError = true;

            this.#ReadyState (this.#eSTATE.LOGGEDOUT);
         }
      }
      else
      {
         this.#pSource = undefined;
         this.#pParams = undefined;

         this.#bError = true;

         this.#ReadyState (this.#eSTATE.LOGGEDOUT);
      }

      this.#Progress ({ nProgress: this.#ePROGRESS.LOGIN_RESULT, bVoluntary, dwResult: this.#dwResult, pLogin: this.#pLogin, bResult: !this.#bError });
   }

   #Logout_Request (bVoluntary, bDisconnected)
   {
      let bExit = false;

      if (this.#ReadyState () == this.#eSTATE.LOGGEDIN)
      {
         this.ClearError ();

         this.#ReadyState (this.#eSTATE.LOGGING);

         this.#Progress ({ nProgress: this.#ePROGRESS.LOGOUT_ATTEMPT, bVoluntary, bDisconnected });

         if (bVoluntary != false  &&  !bDisconnected)
         {
            let pIAction = this.#pSource.Logout_Request (this.#pParams, this.#pLogin);

            if (pIAction)
            {
               if (pIAction.Send (this, this.#Logout_Response, { bVoluntary, bDisconnected }) != false)
               {
                  bExit = true;
               }
               else this.#dwResult = this.RESULT_TRANSMITFAILURE;
            }
            else this.#dwResult = this.RESULT_TRANSMITFAILURE;
         }
         else this.#dwResult = this.RESULT_SUCCESS;

         if (bExit == false)
         {
            this.#Logout_Exit (null, bVoluntary, bDisconnected)
         }
      }
      else
      {
         this.#pSource = undefined;
         this.#pParams = undefined;
      }

      return bExit;
   }

   #Logout_Response (pIAction, pVD)
   {
      this.#dwResult = pIAction.pResponse.nResult;

      this.#Logout_Exit (pIAction, pVD.bVoluntary, pVD.bDisconnected);
   }

   #Logout_Exit (pIAction, bVoluntary, bDisconnected)
   {
      let pLogin = this.#pLogin;

      this.#dwResult = this.RESULT_SUCCESS;

      if (this.#dwResult == this.RESULT_SUCCESS)
      {
         if (pIAction)
         {
            this.#pSource.Logout_Response (this.#pParams, this.#pLogin, pIAction, bVoluntary, bDisconnected);
         }

         this.#bLoggedIn = (this.#bLoggedIn != false  &&  bVoluntary == false);

         if (this.#bLoggedIn == false)
         {
            this.#pLogin = null;
         }

         this.#pSource   = undefined;
         this.#pParams   = undefined;

         this.#ReadyState (this.#eSTATE.LOGGEDOUT);
      }
      else
      {
         this.#pSource = undefined;
         this.#pParams = undefined;

         this.#bError = true;
         this.#ReadyState (this.#eSTATE.LOGGEDIN);
      }

      this.#Progress ({ nProgress: this.#ePROGRESS.LOGOUT_RESULT, bVoluntary, bDisconnected, dwResult: this.#dwResult, pLogin, bResult: !this.#bError });
   }

   ClearError ()
   {
      let bResult = this.#bError;

      if (this.#bError != false)
      {
         if (this.#bLoggedIn == false)
         {
            this.#pLogin = null;
         }

         this.#bError = false;
      }

      return bResult;
   }

   Login (pSource, pParams)
   {
      let bResult = false;

      if (this.#ReadyState () == this.#eSTATE.LOGGEDOUT)
      {
         if (pParams != null)
         {
            this.#pSource = pSource;
            this.#pParams = pParams;

            bResult = this.#Login_Request (true);
         }
      }

      return bResult;
   }

   Logout (pSource, pParams)
   {
      let bResult = false;

      if (this.#ReadyState () == this.#eSTATE.LOGGEDIN)
      {
         this.#pSource = pSource;
         this.#pParams = pParams;

         bResult = this.#Logout_Request (true);
      }

      return bResult;
   }

   static #apAction =
   {
   }
}

MV.MVRest.REST_SESSION = class extends MV.MVMF.SOURCE_SESSION
{
   static asProgress =
   [
      "LOGIN_ATTEMPT",
      "LOGIN_RESULT",
      "LOGOUT_ATTEMPT",
      "LOGOUT_RESULT",
   ];

   asProgress = MV.MVRest.REST_SESSION.asProgress;

   constructor (pReference, pClient)
   {
      super (pReference, pClient);
   }

   initialize (pModel)
   {
      super.initialize (pModel);

      this.pModel.twClientIx = this.pClient.twClientIx;
   }

   get ePROGRESS () { return this.pClient.ePROGRESS; }

   Progress (pProgress)
   {
      console.log
      (
         this.asProgress[pProgress.nProgress] +
         (pProgress.bVoluntary === false ? ' (reconnect)' : '') +
         (pProgress.dwResult !== undefined ? ': ' + pProgress.dwResult : '') +
         ' =>  [' + this.pClient.pService.sNamespace + '] using ' + this.pClient.sEndPoint
      );

      switch (pProgress.nProgress)
      {
         case this.ePROGRESS.LOGIN_RESULT:
            if (pProgress.bResult != false)
            {
            }
            break;

         case this.ePROGRESS.LOGOUT_RESULT:
            if (pProgress.bResult != false)
            {
            }
            break;
      }

      this.pModel.Progress (pProgress);
   }

   LoggedOut ()
   {
      console.log ('LOGGEDOUT');

      this.pModel.LoggedOut ();
   }

   Attach (pThis, bPropagate)
   {
      super.Attach ();

      return true;
   }

   Detach (pThis)
   {
      super.Detach ();

      return true;
   }

   Connect ()
   {
      return false;
   }

   Disconnect (bVoluntary)
   {
      return false;
   }
}

MV.MVRest.POST_JSON =
{
   Encode: function (pIAction, sAction, pLogin)
   {
      let pRequest = pIAction.pRequest;

      let pOptions =
      {
         method         : 'POST',

         headers        :
         {
            "Accept"        : 'application/json',
            "Content-Type"  : 'application/json; charset=UTF-8',
            "Session-Token" : (pLogin  &&  pLogin.sSessionToken) ? pLogin.sSessionToken : ''
         },

         body           : JSON.stringify (pRequest)

      };

      pIAction.sAction = sAction;

      return pOptions;
   },

   Decode: function (pIAction, pXHR)
   {
      let pResponse = pIAction.pResponse;

      let pData = JSON.parse (pXHR.responseText);

      for (let sProperty in pData)
         pResponse[sProperty] = pData[sProperty];

      pIAction.dwResult = pResponse.nResult;
      pIAction.Response ();
      pIAction.destructor ();
   },

   Error: function (pIAction, pXHR)
   {
      let pResponse = pIAction.pResponse;

      pResponse.nResult     = 0xFFFF - 1000;
      pResponse.nStatus     = pXHR.status;
      pResponse.sStatusText = pXHR.statusText;

      pIAction.dwResult = pResponse.nResult;
      pIAction.Response ();
      pIAction.destructor ();
   }
}

MV.MVRest.GET_JSON =
{
   GetQueryParam: function (pRequest)
   {
      let sResult = '';

      for (let sParam in pRequest)
      {
         if (sResult != '')
            sResult += '&';
         sResult += sParam + '=' + encodeURIComponent (pRequest[sParam]);
      }

      return sResult;
   },

   Encode: function (pIAction, sAction, pLogin)
   {
      let pRequest = pIAction.pRequest;

      let pOptions =
      {
         method         : 'GET',

         headers        :
         {
            "Accept"        : 'application/json',
            "Content-Type"  : 'application/json; charset=UTF-8',

         },

         sQuery         : this.GetQueryParam (pRequest),

         body           : ''

      };

      pIAction.sAction = sAction;

      return pOptions;
   },

   Decode: function (pIAction, pXHR)
   {
      let pResponse = pIAction.pResponse;

      let pData = JSON.parse (pXHR.responseText);

      for (let sProperty in pData)
         pResponse[sProperty] = pData[sProperty];

      pIAction.wResult = 0;
      pIAction.Response ();
      pIAction.destructor ();
   },

   Error: function (pIAction, pXHR)
   {
      let pResponse = pIAction.pResponse;

      pResponse.nResult     = 0xFFFF - 1000;
      pResponse.nStatus     = pXHR.status;
      pResponse.sStatusText = pXHR.statusText;

      pIAction.wResult = 1;
      pIAction.Response ();
      pIAction.destructor ();
   }
}

MV.MVRest.REST_SESSION.FACTORY = class extends MV.MVMF.SOURCE_SESSION.FACTORY
{
   constructor (sID_Service, sID_Model, apAction)
   {
      super (sID_Service, sID_Model, 0, apAction);
   }
}

MV.MVRest.REST_OBJECT = class extends MV.MVMF.MEM.SOURCE
{
   constructor (pReference, pClient)
   {
      super (pReference, pClient, new MV.MVRest.REST_OBJECT.OBJECTHEAD ());

      this.pData                = null;
   }

   destructor ()
   {
      this.bData                = null;
      this.aBuffer              = null;

      return super.destructor ();
   }

   get twEventIz () { return this.pObjectHead.twEventIz; }

   Map_Read (pModel)
   {
   }

   Map_Write (pData, bFlags, bDiscard)
   {
      this.pData = pData;
   }

   Partial ()
   {
      this.pModel.Partial ();
   }

   Full ()
   {
      this.pModel.Full ();
   }

   Recovering ()
   {
      this.pModel.Recovering ();
   }

   Recovered ()
   {
      this.pModel.Recovered ();
   }

   Inserted (pChild, pChange)
   {
      if (pChild == null)
      {
         this.Map_Read (this.pModel);
      }

      this.pModel.Inserted (pChild ? pChild.pModel : null, pChange);
   }

   Deleting (pChild, pChange)
   {
      this.pModel.Deleting (pChild ? pChild.pModel : null, pChange);
   }

   Updating (pChild)
   {
      this.pModel.Updating (pChild ? pChild.pModel : null);
   }

   Updated (pChild)
   {
      if (pChild == null)
      {
         this.Map_Read (this.pModel);
      }

      this.pModel.Updated (pChild ? pChild.pModel : null);
   }

   Changing (pChild, pChange)
   {
      this.pModel.Changing (pChild ? pChild.pModel : null, pChange);
   }

   Changed  (pChild, pChange)
   {

      {
         this.Map_Read (this.pModel);
      }

      this.pModel.Changed (pChild ? pChild.pModel : null, pChange);
   }

   Attach ()
   {
      let bResult = false;

      super.Attach ();

      {

         bResult = true;
      }

      return bResult;
   }

   Detach ()
   {
      let bResult = false;

      {
         this.pClient.pMem.Object_Delete_Full (this);

         bResult = true;
      }

      super.Detach ();

      return bResult;
   }
}

MV.MVRest.REST_OBJECT.FACTORY = class extends MV.MVMF.MEM.SOURCE.FACTORY
{

}

MV.MVRest.REST_OBJECT.OBJECTHEAD = class extends MV.MVMF.MEM.SOURCE.OBJECTHEAD
{
   constructor (twParentIx, twObjectIx, wClass_Parent, wClass_Object, wFlags, twEventIz)
   {
      super (twParentIx, twObjectIx, wClass_Parent, wClass_Object, wFlags);

      this.twEventIz = twEventIz;
   }
}

MV.MVRest.REST_SESSION_NULL = class extends MV.MVRest.REST_SESSION
{
   static factory ()
   {
      return new this.FACTORY ('MVRest', 'Session_Null', MV.MVRest.REST_SESSION_NULL.apAction);
   }

   Login_Request (pParams, pLogin)
   {
      return null;
   }

   Login_Response (pParams, pLogin, pIAction, bVoluntary)
   {
      return false;
   }

   Logout_Request (pParams, pLogin)
   {
      return null;
   }

   Logout_Response (pParams, pLogin, pIAction, bVoluntary, bDisconnected)
   {
   }

   Login (pParams)
   {
      return false;
   }

   Logout (pParams)
   {
      return false;
   }

   static apAction =
   {
      NULL  : new MV.MVRest.SERVICE.CLIENT.ACTION
              (
                 'null',
                 {
                 },
                 MV.MVRest.POST_JSON
              ),
   }
}

MV.MVRest.REST_SESSION_NULL.FACTORY = class extends MV.MVRest.REST_SESSION.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRest.REST_SESSION_NULL (this.pReference, pClient);
   }
}

MV.MVRest.Install = function (pCore, pPlugin)
{
   let bResult = true;

   if (this.pRequire = pCore.Require ('MVMF'))
   {
      this.apFactory_Service =
      [
         MV.MVRest.SERVICE          .factory (),
      ];

      this.apFactory_Source =
      [
         MV.MVRest.REST_SESSION_NULL.factory (),
      ];

      pPlugin.Factory_Services (this.apFactory_Service);
      pPlugin.Factory_Sources  (this.apFactory_Source);
   }
   else bResult = false;

   return bResult;
}

MV.MVRest.Unstall = function (pCore, pPlugin)
{
   let n;

   if (this.pRequire)
   {
      for (n=0; n<this.apFactory_Service.length; n++)
         this.apFactory_Service[n] = this.apFactory_Service[n].destructor ();

      for (n=0; n<this.apFactory_Source.length; n++)
         this.apFactory_Source[n] = this.apFactory_Source[n].destructor ();

      this.pRequire = pCore.Release (this.pRequire);
   }
}

