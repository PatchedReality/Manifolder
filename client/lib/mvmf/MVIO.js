
/*
import { MV } from '@metaversalcorp/mvmf'
*/
/*
const { MV } = require ('@metaversalcorp/mvmf');
*/

MV.MVIO = MV.Library ('MVIO', 'Copyright 2014-2024 Metaversal Corporation. All rights reserved.', 'Metaversal Socket IO', '0.23.7');

MV.MVIO.SERVICE = class extends MV.MVMF.SERVICE
{
   static factory ()
   {
      return new this.FACTORY ('MVIO');
   }

   static eCLIENT =
   {
      CONNECTED    : 0,
      DISCONNECTED : 1,
   };

   eCLIENT = MV.MVIO.SERVICE.eCLIENT;

   #pNetSettings;

   constructor (pReference, pNamespace)
   {
      super (pReference, pNamespace);

      this.#pNetSettings = pReference.pNetSettings;
   }

   get pNetSettings () { return this.#pNetSettings; }

   Client_Open (twClientIx)
   {
      return super.Client_Open (MV.MVIO.SERVICE.CLIENT.Reference (twClientIx));
   }

   Client_Close (pClient)
   {
      return super.Client_Close (pClient);
   }

   Connected (pClient)
   {
      this.Emit ('onClient', { nConnected: this.eCLIENT.CONNECTED,    pClient });

      return true;
   }

   Disconnected (pClient)
   {
      this.Emit ('onClient', { nConnected: this.eCLIENT.DISCONNECTED, pClient });
   }
}

MV.MVIO.SERVICE.FACTORY = class extends MV.MVMF.SERVICE.FACTORY
{

   Reference (sConnect)
   {
      return new MV.MVIO.SERVICE.IREFERENCE (this.sID, sConnect);
   }
}

MV.MVIO.SERVICE.IREFERENCE = class extends MV.MVMF.SERVICE.IREFERENCE
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
      return new MV.MVIO.SERVICE (this, pNamespace);
   }
}

MV.MVIO.SERVICE.CLIENT = class extends MV.MVMF.CLIENT
{
   static sID = 'MVIO';

   static eSTATE =
   {
      SOCKETCONNECT    : 0,
      SOCKETCONNECTING : 1,
      LOGGEDOUT        : 2,
      LOGGING          : 3,
      LOGGEDIN         : 4,
   };

   static ePROGRESS =
   {
      SOCKETCONNECT_ATTEMPT    :  0,
      SOCKETCONNECT_RESULT     :  1,
      SOCKETDISCONNECT_ATTEMPT :  2,
      SOCKETDISCONNECT_RESULT  :  3,
      LOGIN_ATTEMPT            :  4,
      LOGIN_RESULT             :  5,
      LOGOUT_ATTEMPT           :  6,
      LOGOUT_RESULT            :  7,
   };

   sID       = MV.MVIO.SERVICE.CLIENT.sID;
   eSTATE    = MV.MVIO.SERVICE.CLIENT.eSTATE;
   ePROGRESS = MV.MVIO.SERVICE.CLIENT.ePROGRESS;

   #aRecv  = {};

   pNet;

   #pRecover;
   #pRefresh;
   #pSubscription;
   #pControl;

   #pObjectHead = new MV.MVIO.IO_OBJECT.OBJECTHEAD ();

   constructor (pReference, pService)
   {
      super (pReference, pService);

      this.#pRecover           = new MV.MVIO.SERVICE.CLIENT.RECOVER (this);
      this.#pRefresh           = new MV.MVIO.SERVICE.CLIENT.REFRESH (this);
      this.#pSubscription      = new MV.MVIO.SERVICE.CLIENT.SUBSCRIPTION (this);
      this.#pControl           = new MV.MVIO.SERVICE.CLIENT.CONTROL (this, this.pService.pNetSettings, this.#pSubscription);

      this.pNet                = new MV.MVIO.SERVICE.CLIENT.NET (this);
      this.pNet.onConnected    = this.Connected;
      this.pNet.onDisconnected = this.Disconnected;
      this.pNet.onRecv_Request = this.Recv_Request;
   }

   destructor ()
   {
      this.pNet           = this.pNet.destructor ();

      this.#pControl      = this.#pControl.destructor ();
      this.#pSubscription = this.#pSubscription.destructor ();
      this.#pRefresh      = this.#pRefresh.destructor ();
      this.#pRecover      = this.#pRecover.destructor ();

      return super.destructor ();
   }

   static Reference (twClientIx)
   {
      return new MV.MVIO.SERVICE.CLIENT.IREFERENCE (twClientIx);
   }

   get sEndPoint     () { return this.#pControl.sEndPoint;     }
   get bNetConnected () { return this.#pControl.bNetConnected; }
   get bLoggedIn     () { return this.#pControl.bLoggedIn;     }
   get pLogin        () { return this.#pControl.pLogin;        }
   get sHost         () { return this.#pControl.sHost;         }
   get wPort         () { return this.#pControl.wPort;         }
   get bSecure       () { return this.#pControl.bSecure;       }

   Connected ()
   {
      this.pService.Connected (this);
   }

   Disconnected ()
   {
      this.SocketDisconnected (false);

      this.pService.Disconnected (this);
   }

   Progress (pProgress)
   {
      let pSource = this.Source (0);

      if (pSource)
         pSource.Progress (pProgress);
   }

   Recv_Register (sAction, pThis)
   {
      this.#aRecv[sAction] = pThis;
   }

   Recv_Unregister (sAction)
   {
      delete this.#aRecv[sAction];
   }

   Recv_Request (sAction, pData)
   {
      if (this.#aRecv[sAction])
         this.#aRecv[sAction].onRecv_Request (sAction, pData);

      return true;
   }

   SafeKill ()
   {

      return true;
   }

   IsDisconnected ()
   {
      return (this.ReadyState () == this.eSTATE.SOCKETCONNECT);
   }

   IsConnected ()
   {
      return (this.ReadyState () >= this.eSTATE.LOGGEDOUT);
   }

   ClearError         ()           { return this.#pControl.ClearError         ()                        ; }
   SocketConnect      ()           { return this.#pControl.SocketConnect      ()                        ; }
   SocketReconnect    ()           { return this.#pControl.SocketReconnect    ()                        ; }
   SocketDisconnect   ()           { return this.#pControl.SocketDisconnect   ()                        ; }
   SocketDisconnected (bVoluntary) { return this.#pControl.SocketDisconnected (bVoluntary)              ; }
   Login              (pParams)    { return this.#pControl.Login              (this.Source (0), pParams); }
   Logout             (pParams)    { return this.#pControl.Logout             (this.Source (0), pParams); }

   Request (pAction)
   {
      return new MV.MVIO.SERVICE.CLIENT.IACTION (this, pAction);
   }

   Object_Subscribe (wClass, twObjectIx)
   {
      let bResult = false;

      if (this.#pSubscription.Add (wClass, twObjectIx) != false)
      {

         bResult = true;
      }

      return bResult;
   }

   Object_Unsubscribe (wClass, twObjectIx)
   {
      let bResult = false;

      if (this.#pSubscription.Remove (wClass, twObjectIx) != false)
      {

         bResult = true;
      }

      return bResult;
   }

   Object_Recover (pData)
   {
      let dwResult = 0;

      this.#pObjectHead.twParentIx    = pData.pObjectHead.twParentIx;
      this.#pObjectHead.twObjectIx    = pData.pObjectHead.twObjectIx;
      this.#pObjectHead.wClass_Parent = pData.pObjectHead.wClass_Parent;
      this.#pObjectHead.wClass_Object = pData.pObjectHead.wClass_Object;
      this.#pObjectHead.wFlags        = pData.pObjectHead.wFlags;
      this.#pObjectHead.twEventIz     = pData.pObjectHead.twEventIz;

      {
         this.pMem.Object_Update
         (
            this.#pObjectHead,
            this,
            function (pObject, bDiscard)
            {
               pObject.Map_Write (pData, this.#pObjectHead.wFlags, bDiscard);

               return true;
            }
         );
      }

      return dwResult;
   }
}

MV.MVIO.SERVICE.CLIENT.IREFERENCE = class extends MV.MVMF.SHAREDOBJECT.IREFERENCE
{
   constructor (twClientIx)
   {
      super (MV.MVIO.SERVICE.CLIENT.sID);

      this.twClientIx = twClientIx;
   }

   Key ()
   {
      return this.twClientIx;
   }

   Create (pService)
   {
      return new MV.MVIO.SERVICE.CLIENT (this, pService)
   }
}

MV.MVIO.SERVICE.CLIENT.ACTION = class
{
   constructor (sAction, pRequest, fnConvert)
   {
      this.sAction   = sAction;
      this.pRequest  = pRequest;
      this.fnConvert = fnConvert;
   }
}

MV.MVIO.SERVICE.CLIENT.IACTION = class
{
   #pClient;
   #pAction;

   #pRequest;
   #pResponse;

   #pThis;
   #fnResponse;
   #pParam;

   #dwResult;

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

   Response (pResponse)
   {
      this.#pResponse = pResponse;

      this.#dwResult  = pResponse.nResult;

      if (this.#fnResponse)
         this.#fnResponse.call (this.#pThis, this, this.#pParam);
   }

   get Action    ()        { return this.#pAction.sAction;   }
   get bResponse ()        { return this.#pAction.bResponse; }
   get fnConvert ()        { return this.#pAction.fnConvert; }

   get pRequest  ()        { return this.#pRequest;          }
   get pResponse ()        { return this.#pResponse;         }
   get dwResult  ()        { return this.#dwResult;          }

   set dwResult  (dwResult) { this.#dwResult = dwResult;        }

   Send (pThis, fnResponse, pParam)
   {
      let bResult = false;

      this.#pThis      = pThis;
      this.#fnResponse = fnResponse;
      this.#pParam     = pParam;

      if (this.#pClient.ReadyState () > this.#pClient.eSTATE.SOCKETCONNECT)
      {
         bResult = this.#pClient.pNet.Send_Request (this);
      }

      return bResult;
   }

   GetResult ()
   {
      return this.#dwResult;
   }

   IsSuccess ()
   {
      return (this.#dwResult == 0);
   }
}

MV.MVIO.SERVICE.CLIENT.CONTROL = class
{
   #pClient;
   #pSubscription;

   #eSTATE;
   #ePROGRESS;

   #bError;
   #dwResult;

   #sopModel;
   #apSource;

   #sHost;
   #wPort;
   #bSecure;
   #bNetConnected;
   #bSocketConnected;

   #pSource;
   #pParams;
   #pLogin;
   #bLoggedIn;

   IO_RESULT_SUCCESS         = 0;
   IO_RESULT_TRANSMITFAILURE = -1000;

   constructor (pClient, pNetSettings, pSubscription)
   {
      this.#pClient           = pClient;
      this.#pSubscription     = pSubscription;

      this.#eSTATE            = pClient.eSTATE;
      this.#ePROGRESS         = pClient.ePROGRESS;

      this.#bError            = false;
      this.#dwResult           = this.IO_RESULT_SUCCESS;

      this.#bSecure           = pNetSettings.bSecure;
      this.#sHost             = pNetSettings.sHost;
      this.#wPort             = pNetSettings.wPort;
      this.#bNetConnected     = false;
      this.#bSocketConnected  = false;

      this.#pLogin            = null;
      this.#bLoggedIn         = false;
   }

   destructor ()
   {
      return null;
   }

   get sEndPoint         () { return this.#pClient.pNet.EndPoint (this.#bSecure, this.#sHost, this.#wPort); }
   get bNetConnected     () { return this.#bNetConnected;    }
   get bLoggedIn         () { return this.#bLoggedIn; }
   get pLogin            () { return this.#pLogin;    }
   get sHost             () { return this.#sHost; }
   get wPort             () { return this.#wPort; }
   get bSecure           () { return this.#bSecure; }

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
      return this.#pClient.Request (MV.MVIO.SERVICE.CLIENT.CONTROL.#apAction[sAction]);
   }

   #SocketConnect_Attempt (bVoluntary)
   {
      let bExit = false;

      bVoluntary = (this.#bSocketConnected == false);

      if (this.#ReadyState () == this.#eSTATE.SOCKETCONNECT)
      {
         this.ClearError ();

         this.#ReadyState (this.#eSTATE.SOCKETCONNECTING);

         this.#Progress ({ nProgress: this.#ePROGRESS.SOCKETCONNECT_ATTEMPT, bVoluntary });

         if (this.#pClient.pNet.Connect (this.#bSecure, this.#sHost, this.#wPort, this, this.#SocketConnect_Complete, bVoluntary) != false)
         {
            bExit = true;
         }
         else this.#dwResult = this.IO_RESULT_TRANSMITFAILURE;

         if (bExit == false)
         {
            this.#SocketConnect_Exit (false, bVoluntary)
         }
      }

      return bExit;
   }

   #SocketConnect_Complete (bConnected, bVoluntary)
   {
      if (bConnected != false)
      {
         this.#dwResult = this.IO_RESULT_SUCCESS;
      }
      else this.#dwResult = this.IO_RESULT_TRANSMITFAILURE;

      this.#SocketConnect_Exit (bConnected, bVoluntary)
   }

   #SocketConnect_Exit (bConnected, bVoluntary)
   {
      if (this.#dwResult == this.IO_RESULT_SUCCESS)
      {
         this.#bNetConnected = true;

         this.#bSocketConnected = true;

         this.#ReadyState (this.#eSTATE.LOGGEDOUT);

         if (bVoluntary == false  &&  this.#bLoggedIn == false)
            this.#pSubscription.Subscribe_Aux ();
      }
      else
      {
         this.#bError = true;
         this.#ReadyState (this.#eSTATE.SOCKETCONNECT);
      }

      this.#Progress ({ nProgress: this.#ePROGRESS.SOCKETCONNECT_RESULT, bVoluntary, dwResult: this.#dwResult, bResult: !this.#bError });
   }

   #SocketDisconnect_Attempt (bVoluntary, bDisconnected)
   {
      let bExit = false;

      if (this.#ReadyState () == this.#eSTATE.LOGGEDOUT)
      {
         this.ClearError ();

         this.#ReadyState (this.#eSTATE.SOCKETCONNECTING);

         this.#Progress ({ nProgress: this.#ePROGRESS.SOCKETDISCONNECT_ATTEMPT, bVoluntary, bDisconnected });

         if (this.#pClient.pNet.Disconnect (this, this.#SocketDisconnect_Complete, { bVoluntary, bDisconnected }) != false)
         {
            bExit = true;
         }
         else this.#dwResult = this.IO_RESULT_TRANSMITFAILURE;

         if (bExit == false)
         {
            this.#SocketDisconnect_Exit (false, bVoluntary, bDisconnected)
         }
      }

      return bExit;
   }

   #SocketDisconnect_Complete (bConnected, pVD)
   {
      this.#dwResult = this.IO_RESULT_SUCCESS;

      this.#SocketDisconnect_Exit (bConnected, pVD.bVoluntary, pVD.bDisconnected);
   }

   #SocketDisconnect_Exit (bConnected, bVoluntary, bDisconnected)
   {
      this.#dwResult = this.IO_RESULT_SUCCESS;

      if (this.#dwResult == this.IO_RESULT_SUCCESS)
      {
         this.#bNetConnected = false;

         this.#bSocketConnected = (this.#bSocketConnected != false  &&  bVoluntary == false);

         this.#ReadyState (this.#eSTATE.SOCKETCONNECT);
      }
      else
      {
         this.#bError = true;
         this.#ReadyState (this.#eSTATE.LOGGEDOUT);
      }

      this.#Progress ({ nProgress: this.#ePROGRESS.SOCKETDISCONNECT_RESULT, bVoluntary, bDisconnected, dwResult: this.#dwResult, bResult: !this.#bError });
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
            else this.#dwResult = this.IO_RESULT_TRANSMITFAILURE;
         }
         else this.#dwResult = this.IO_RESULT_TRANSMITFAILURE;

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
      if (pIAction  &&  this.#dwResult == this.IO_RESULT_SUCCESS)
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

            if (bVoluntary == false)
               this.#pSubscription.Subscribe_Aux ();
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
               else this.#dwResult = this.IO_RESULT_TRANSMITFAILURE;
            }
            else this.#dwResult = this.IO_RESULT_TRANSMITFAILURE;
         }
         else this.#dwResult = this.IO_RESULT_SUCCESS;

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

      this.#dwResult = this.IO_RESULT_SUCCESS;

      if (this.#dwResult == this.IO_RESULT_SUCCESS)
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

   SocketConnect ()
   {
      return this.#SocketConnect_Attempt (true);
   }

   SocketReconnect ()
   {
      return this.SocketConnect ();
   }

   SocketDisconnect ()
   {
      return this.#SocketDisconnect_Attempt (true);
   }

   SocketDisconnected (bVoluntary)
   {
      let bResult = false;

      if (this.#bNetConnected != false)
      {

         this.ClearError ();

         this.#Logout_Request           (bVoluntary, true);
         this.#SocketDisconnect_Attempt (bVoluntary, true);

         bResult = true;
      }

      return bResult;
   }

   Login (pSource, pParams)
   {
      let bResult = false;

      if (this.#ReadyState () == this.#eSTATE.LOGGEDOUT)
      {
         if (this.#bLoggedIn == false  &&  pParams      != null
         ||  this.#bLoggedIn != false  &&  this.#pLogin != null)
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

MV.MVIO.SERVICE.CLIENT.SUBSCRIPTION = class
{
   #pClient;

   #aSubscription = [];

   constructor (pClient)
   {
      this.#pClient = pClient;

   }

   destructor ()
   {

      return null;
   }

   #Request (sAction)
   {
      return this.#pClient.Request (MV.MVIO.SERVICE.CLIENT.SUBSCRIPTION.#apAction[sAction]);
   }

   #Get (wClass, twObjectIx)
   {
      let Subscription = null;
      let bSubscription;

      for (bSubscription=0; bSubscription<this.#aSubscription.length; bSubscription++)
         if (this.#aSubscription[bSubscription].wClass == wClass  &&  this.#aSubscription[bSubscription].twObjectIx == twObjectIx)
         {
            Subscription = this.#aSubscription[bSubscription];
            break;
         }

      return Subscription;
   }

   #Insert (wClass, twObjectIx)
   {
      let Subscription =
      {
         nCount     : 0,
         bFlag      : 0,
         wClass     : wClass,
         twObjectIx : twObjectIx
      };

      this.#aSubscription.push (Subscription);

      return Subscription;
   }

   #Delete (Subscription)
   {
      let pObjectBank, pObject;

      if ((pObjectBank = this.#pClient.pMem.ObjectBank (Subscription.wClass)) != null)
         if ((pObject = pObjectBank.Get (null, Subscription.twObjectIx)) != null)
            this.#pClient.pMem.Object_Delete_Full (pObject);

      let bSubscription = this.#aSubscription.indexOf (Subscription);

      this.#aSubscription.splice (bSubscription, 1);
   }

   #Objects_Response (pIAction)
   {

   }

   Add (wClass, twObjectIx)
   {
      let bResult = false;
      let Subscription;

         if ((Subscription = this.#Get (wClass, twObjectIx)) == null)
         {

            {
               Subscription = this.#Insert (wClass, twObjectIx);

               {
                  let pIAction = this.#Request ('SUBSCRIBE');
                  let pRequest = pIAction.pRequest;

                  pRequest.twObjectIx    = twObjectIx;
                  pRequest.wClass_Object = wClass;

                  pIAction.Send (this, this.#Objects_Response);
               }
            }
         }

         if (Subscription != null)
         {
            Subscription.nCount++;

            bResult = true;
         }

      return bResult;
   }

   Remove (wClass, twObjectIx)
   {
      let bResult = false;
      let Subscription;

         if ((Subscription = this.#Get (wClass, twObjectIx)) != null)
         {
            if (Subscription.nCount > 0)
            {
               Subscription.nCount--;

               if (Subscription.nCount == 0)
               {
                  this.#Delete (Subscription);

                  {
                     let pIAction = this.#Request ('UNSUBSCRIBE');
                     let pRequest  = pIAction.pRequest;

                     pRequest.twObjectIx    = twObjectIx;
                     pRequest.wClass_Object = wClass;

                     pIAction.Send (this, this.#Objects_Response);
                  }
               }

               bResult = true;
            }
         }

      return bResult;
   }

   Subscribe_Aux ()
   {
      let bSubscription;
      let Subscription;

         for (bSubscription=0; bSubscription<this.#aSubscription.length; bSubscription++)
         {
            Subscription = this.#aSubscription[bSubscription];

            let pIAction = this.#Request ('SUBSCRIBE');
            let pRequest  = pIAction.pRequest;

            pRequest.twObjectIx    = Subscription.twObjectIx;
            pRequest.wClass_Object = Subscription.wClass;

            pIAction.Send (this, this.#Objects_Response);
         }

   }

   static #apAction =
   {
      SUBSCRIBE   :  new MV.MVIO.SERVICE.CLIENT.ACTION
                     (
                        'subscribe',
                        {
                           twObjectIx    : 0,
                           wClass_Object : 0
                        }
                     ),

      UNSUBSCRIBE :  new MV.MVIO.SERVICE.CLIENT.ACTION
                     (
                        'unsubscribe',
                        {
                           twObjectIx    : 0,
                           wClass_Object : 0
                        }
                     )
   };
}

/*
import { io } from "socket.io-client";
*/
/*
const { io } = require("socket.io-client");
*/

MV.MVIO.SERVICE.CLIENT.NET = class
{
   static eSTATE =
   {
      NOTCONNECTED : 0,
      CONNECTING   : 1,
      CONNECTED    : 2,
      CLOSED       : 3,
   };

   static eRESULT =
   {
      DISCONNECT:   0,
      SOCKETCLOSE:  1,
      SOCKETERROR:  2,
      TIMEOUT:      3,
   };

   eSTATE  = MV.MVIO.SERVICE.CLIENT.NET.eSTATE;
   eRESULT = MV.MVIO.SERVICE.CLIENT.NET.eRESULT;

   constructor (pClient)
   {
      this.pClient = pClient;

      this.onConnected    = null;
      this.onDisconnected = null;
      this.onRecv_Request = null;

      this.nState       = this.eSTATE.NOTCONNECTED;
      this.pThis        = null;
      this.fnCompletion = null;
      this.pParam       = null;

      this.ioClient     = null;

      this.dwResult      = 0;
   }

   destructor ()
   {
      if (this.nState > this.eSTATE.NOTCONNECTED)
      {
         this.onClose ();
      }

      this.onConnected    = null;
      this.onDisconnected = null;
      this.onRecv_Request = null;

      this.pClient = null;

      return null;
   }

   onOpen ()
   {
      let pThis        = this.pThis;
      let fnCompletion = this.fnCompletion;
      let pParam       = this.pParam;

      this.nState       = this.eSTATE.CONNECTED;
      this.pThis        = null;
      this.fnCompletion = null;
      this.pParam       = null;

      if (fnCompletion != null)
         fnCompletion.call (pThis, true, pParam);

      if (this.onConnected != null)
         this.onConnected.call (this.pClient);
   }

   onClose (reason, bError)
   {

      {

         if (this.dwResult == 0)
            this.dwResult = this.eRESULT.SOCKETCLOSE;

         let prevState     = this.nState;
         let pThis         = this.pThis;
         let fnCompletion  = this.fnCompletion;
         let pParam        = this.pParam;

         this.ioClient     = null;

         this.nState       = this.eSTATE.NOTCONNECTED;
         this.pThis        = null;
         this.fnCompletion = null;
         this.pParam       = null;

         if (fnCompletion != null)
            fnCompletion.call (pThis, false, pParam);

         if (this.onDisconnected != null && prevState > this.eSTATE.CONNECTING)
            this.onDisconnected.call (this.pClient);
      }
   }

   onConnectError (e)
   {
      this.Close (this.eRESULT.SOCKETERROR);
   }

   Recv (sEvent, args, responseFn)
   {
      if (this.onRecv_Request != null)
      {
         if (this.onRecv_Request.call (this.pClient, sEvent, args) == false)
         {
            console.log ('OnRecv_Request failed for ' + sEvent);
         }
      }
   }

   Close (dwResult)
   {
      if (this.nState > this.eSTATE.NOTCONNECTED && this.nState < this.eSTATE.CLOSED)
      {
         let nState_Prev = this.nState;

         this.nState = this.eSTATE.CLOSED;

         this.dwResult = dwResult;

         if (dwResult != this.eRESULT.DISCONNECT)
            console.log ('UNEXPECTED SOCKET CLOSED: (' + dwResult + ')');

         this.ioClient.close ();

         if (nState_Prev == this.eSTATE.CONNECTING)
            this.onClose (null, true);
      }
   }

   EndPoint (bSecure, sHost, wPort)
   {
      let sProtocol = bSecure ? 'wss' : 'ws';

      return sProtocol + '://' + sHost + ':' + wPort;
   }

   Connect (bSecure, sHost, wPort, pThis, fnCompletion, pParam)
   {
      let bResult = true;
      let This = this;

      if (this.nState == this.eSTATE.NOTCONNECTED)
      {
         this.pThis = pThis;
         this.fnCompletion = fnCompletion;
         this.pParam = pParam;

         this.nState = this.eSTATE.CONNECTING;

         const ioOptions =
         {
            autoConnect:   false,
            reconnection:  false,
            transports:    ['websocket']
         };
         const sUrl = this.EndPoint (bSecure, sHost, wPort);

         this.ioClient = io (sUrl, ioOptions);

         this.ioClient.on ('connect',       function ()    { This.onOpen  ();    });
         this.ioClient.on ('connect_error', function (err) { This.onConnectError (err); });
         this.ioClient.on ('disconnect',    function (e)   { This.onClose (e);   });

         this.ioClient.onAny ((event, ...args) => {
            This.Recv (event, (args && args.length > 0) ? args[0] : args);
         });

         this.ioClient.connect ();

         this.dwResult = 0;
      }
      else bResult = false;

      return bResult;
   }

   Disconnect (pThis, fnCompletion, pParam)
   {
      var bResult = true;

      if (this.nState == this.eSTATE.CONNECTED)
      {
         this.pThis        = pThis;
         this.fnCompletion = fnCompletion;
         this.pParam       = pParam;

         this.Close (this.eRESULT.DISCONNECT);
      }
      else bResult = false;

      return bResult;
   }

   Send_Request (pIAction)
   {
      let bResult = false;

      if (this.nState == this.eSTATE.CONNECTED)
      {
         let pRequest;

         if (pIAction.fnConvert)
         {
            pRequest = {};
            pIAction.fnConvert (pRequest, pIAction.pRequest);
         }
         else pRequest = pIAction.pRequest;

         this.ioClient.emit (pIAction.Action, pRequest, pIAction.Response.bind (pIAction));

         bResult = true;
      }

      return bResult;
   }
}

MV.MVIO.SERVICE.CLIENT.RECOVER = class
{
   #pClient;

   constructor (pClient)
   {
      this.#pClient = pClient;

      this.#pClient.Recv_Register ('recover', this);
   }

   destructor ()
   {
      this.#pClient.Recv_Unregister ('recover');

      return null;
   }

   #Object_Recover (pResponse)
   {
      let nResultSet, pRow, nObject, pObjectHead, pObject;

      if (pResponse.nResult == 0)
      {
         nResultSet = 0;

         if (nResultSet < pResponse.aResultSet.length)
         {
            pRow = pResponse.aResultSet[nResultSet];

            if (pRow.length == 1)
            {
               nObject = 0;

               pRow[nObject].Object = JSON.parse (pRow[nObject].Object);

               pObjectHead = pRow[nObject].Object.pObjectHead;

               if ((pObject = (this.#pClient.pMem.ObjectBank (pObjectHead.wClass_Object)).Get (null, pObjectHead.twObjectIx)) != null)
               {
                  this.#pClient.pMem.Object_Expire_Full (pObject);

                  this.#pClient.Object_Recover (pRow[nObject].Object);

                  for (nResultSet++; nResultSet<pResponse.aResultSet.length; nResultSet++)
                  {
                     pRow = pResponse.aResultSet[nResultSet];

                     if (pRow.length > 0)
                     {
                        for (nObject=0; nObject<pRow.length; nObject++)
                           pRow[nObject].Object = JSON.parse (pRow[nObject].Object);

                        for (nObject=0; nObject<pRow.length; nObject++)
                        {
                           this.#pClient.Object_Recover (pRow[nObject].Object);
                        }
                     }
                  }

                  this.#pClient.pMem.Object_Purge_Full (pObject);
               }
            }
         }
      }
   }

   onRecv_Request (sAction, Data)
   {
      this.#Object_Recover (Data);
   }
}

MV.MVIO.SERVICE.CLIENT.REFRESH = class
{
   #pClient;

   constructor (pClient)
   {
      this.#pClient = pClient;

      this.#pClient.Recv_Register ('refresh', this);
   }

   destructor ()
   {
      this.#pClient.Recv_Unregister ('refresh');

      return null;
   }

   #Event_Refresh (pData)
   {

      pData.pChange["sType"] = pData.sType;

      let bResult = this.#pClient.pMem.Object_Change
      (
         pData.pControl.wClass_Object,
         pData.pControl.twObjectIx,
         pData.pControl.wClass_Child,
         pData.pControl.twChildIx,
         pData.pControl.wFlags,
         pData.pChange,
         this,
         function (pParent, pObject, pChild)
         {
            Object.assign (pObject.pData, pData.pObject);

            if (pData.pControl.wClass_Child != 0)
            {
               if (pChild != null)
                  Object.assign (pChild.pData, pData.pChild);
            }

            return true;
         }
      );

      return bResult;
   }

   onRecv_Request (sAction, pData)
   {
      this.#Event_Refresh (pData);

      return true;
   }
}

MV.MVIO.IO_SESSION = class extends MV.MVMF.SOURCE_SESSION
{
   static asProgress =
   [
      'SOCKETCONNECT_ATTEMPT',
      'SOCKETCONNECT_RESULT',
      'SOCKETDISCONNECT_ATTEMPT',
      'SOCKETDISCONNECT_RESULT',
      'LOGIN_ATTEMPT',
      'LOGIN_RESULT',
      'LOGOUT_ATTEMPT',
      'LOGOUT_RESULT',
   ];

   asProgress = MV.MVIO.IO_SESSION.asProgress;

   constructor (pReference, pClient)
   {
      super (pReference, pClient);

      this.nReconnect = 0;
   }

   initialize (pModel)
   {
      super.initialize (pModel);

      this.pModel.twClientIx = this.pClient.twClientIx;
   }

   #Reconnect (nReconnect)
   {
      if (nReconnect != undefined)
         this.nReconnect = nReconnect;
      else if (this.nReconnect == 0)
         this.nReconnect = 1;
      else if (this.nReconnect < 64)
         this.nReconnect *= 2;

      let nDelay = (this.nReconnect * 1000) + Math.floor (Math.random () * 2000)

   console.log ('IOSession attempt reconnect in ' + (nDelay / 1000) + ' seconds from: ', Date.now ());
      setTimeout (this.pClient.SocketReconnect.bind (this.pClient), nDelay);
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
         case this.pClient.ePROGRESS.SOCKETCONNECT_RESULT:
            if (pProgress.bResult != false)
            {
               this.nReconnect = 0;

               if (pProgress.bVoluntary != false)
               {
               }
               else
               {
                  if (this.pClient.bLoggedIn != false)
                  {

                     this.pClient.Login (null);
                  }
                  else
                  {

                  }
               }
            }
            else
            {
               console.log ('failed to connect');

               if (this.pClient.bNetConnected == false)
               {
                  this.#Reconnect ();
               }
            }
            break;

         case this.pClient.ePROGRESS.SOCKETDISCONNECT_RESULT:
            if (pProgress.bResult != false)
            {
               if (pProgress.bVoluntary == false)
               {
                  console.log ('involuntary disconnect');

                  if (this.pClient.bSystemConnected == false)
                  {

                  }

                  this.#Reconnect (0);
               }
            }
            break;

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
      this.Connect ();

      return true;
   }

   Detach (pThis)
   {
      this.Disconnect ();
      super.Detach ();

      return true;
   }

   Connect ()
   {
      return this.pClient.SocketConnect ();
   }

   Disconnect (bVoluntary)
   {
      return this.pClient.SocketDisconnect (bVoluntary);
   }
}

MV.MVIO.IO_SESSION.FACTORY = class extends MV.MVMF.SOURCE_SESSION.FACTORY
{
   constructor (sID_Service, sID_Model, apAction)
   {
      super (sID_Service, sID_Model, 0, apAction);
   }
}

MV.MVIO.IO_OBJECT = class extends MV.MVMF.MEM.SOURCE
{
   constructor (pReference, pClient)
   {
      super (pReference, pClient, new MV.MVIO.IO_OBJECT.OBJECTHEAD ());

      this.pData                = {};
   }

   destructor ()
   {
      this.bData                = null;
      this.aBuffer              = null;

      return super.destructor ();
   }

   get twEventIz () { return this.pObjectHead.twEventIz; }

   Map_Read (pModel) {}

   Map_Write (pData, wFlags, bDiscard)
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
         this.pClient.Object_Subscribe (this.pObjectHead.wClass_Object, this.pObjectHead.twObjectIx);

         bResult = true;
      }

      return bResult;
   }

   Detach ()
   {
      let bResult = false;

      {
         this.pClient.Object_Unsubscribe (this.pObjectHead.wClass_Object, this.pObjectHead.twObjectIx);

         bResult = true;
      }

      super.Detach ();

      return bResult;
   }
}

MV.MVIO.IO_OBJECT.FACTORY = class extends MV.MVMF.MEM.SOURCE.FACTORY
{

}

MV.MVIO.IO_OBJECT.OBJECTHEAD = class extends MV.MVMF.MEM.SOURCE.OBJECTHEAD
{
   constructor (twParentIx, twObjectIx, wClass_Parent, wClass_Object, wFlags, twEventIz)
   {
      super (twParentIx, twObjectIx, wClass_Parent, wClass_Object, wFlags);

      this.twEventIz = twEventIz;
   }
}

MV.MVIO.IO_SESSION_NULL = class extends MV.MVIO.IO_SESSION
{
   static factory ()
   {
      return new this.FACTORY ('MVIO', 'Session_Null', MV.MVIO.IO_SESSION_NULL.apAction);
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
      NULL  : new MV.MVIO.SERVICE.CLIENT.ACTION
              (
                 'null',
                 {
                 }
              ),
   }
}

MV.MVIO.IO_SESSION_NULL.FACTORY = class extends MV.MVIO.IO_SESSION.FACTORY
{

   Create (pClient)
   {
      return new MV.MVIO.IO_SESSION_NULL (this.pReference, pClient);
   }
}

MV.MVIO.Install = function (pCore, pPlugin)
{
   let bResult = true;

   if (this.pRequire = pCore.Require ('MVMF'))
   {
      this.apFactory_Service =
      [
         MV.MVIO.SERVICE        .factory (),
      ];

      this.apFactory_Source =
      [
         MV.MVIO.IO_SESSION_NULL.factory (),
      ];

      pPlugin.Factory_Services (this.apFactory_Service);
      pPlugin.Factory_Sources  (this.apFactory_Source);
   }
   else bResult = false;

   return bResult;
}

MV.MVIO.Unstall = function (pCore, pPlugin)
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

/*
module.exports =
*/
/*
export
*/
/*
{
}
*/

