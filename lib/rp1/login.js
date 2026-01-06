class RP1Login extends PARTIAL_MAIN_BASE
{
   constructor (Target)
   {
      super (Target, 'Log in');

      this.sIcon    = APP.ICON_CONTAINER.MAIN;
      this.nSection = 0;
   }

   onLoad ()
   {
      super.onLoad ();

      this.Tray   = null;
      this.jTray = this.jSelector.find ('.tray_root');

      $('body').addClass ('logging-in');

      this.Swap_Login ();
   }

   onUnload ()
   {
      this.EmptyTray ();

      super.onUnload ();
   }

/*******************************************************************************************************************************
**                                                       Swap Functions                                                       **
*******************************************************************************************************************************/

   EmptyTray ()
   {
      if (this.Tray != null)
      {
         if (this.Tray instanceof (MV.MVUA_Tray.Login.ACCESS))
         {
            $('body').removeClass ('fauxdal');
         }

         this.Tray.Detach (this);
         this.Tray.destructor ();
      }
   }

   Swap_Login ()
   {
      this.EmptyTray ();

      if (g_pRP1Conn.IsLoggedIn () == false)
      {
         this.Tray = new MV.MVUA_Tray.Login.LOGIN (this.jSelector.find ('.tray_root'), g_pRP1Conn.GetCustomVal ('error'), g_pRP1Conn.pLnG);
         this.Tray.Attach (this);
      }
      else
      {
         // TBD: we're already logged in, go somewhere else
      }
   }

   Swap_Reset ()
   {
      this.EmptyTray ();

      this.Tray = new MV.MVUA_Tray.Login.RESET_DEVICE (this.jSelector.find ('.tray_root'), g_pRP1Conn.GetCustomVal ('error'), g_pRP1Conn.pLnG.pSession);
      this.Tray.Attach (this);
   }

   Swap_Landing ()
   {
      this.EmptyTray ();

      this.Tray = new MV.MVUA_Tray.Login.LANDING (this.jSelector.find ('.tray_root'), g_pRP1Conn.GetCustomVal ('error'), 'reset_device_req');
      this.Tray.Attach (this);
   }

   Swap_Access (sContact)
   {
      this.EmptyTray ();

      this.Tray = new MV.MVUA_Tray.Login.ACCESS (this.jSelector.find ('.tray_root'), g_pRP1Conn.GetCustomVal ('error'), g_pRP1Conn.pLnG.pSession.pLogin.pSecure, sContact, g_pRP1Conn.pLnG);
      this.Tray.Attach (this);

      $('body').addClass ('fauxdal');
   }

   onReadyState (pNotice)
   {
      if (pNotice.pCreator == this.Container)
      {
         switch (this.Container.ReadyState ())
         {
            case this.Container.eSTATE.READY_DISCONNECTED:
               break;

            case this.Container.eSTATE.READY_LOGGEDOUT:
               if (this.Tray == null)
                  this.Swap_Login ();
               break;

            case this.Container.eSTATE.READY_LOGGEDIN:
               setTimeout
               (
                  function ()
                  {
                     $('body').removeClass ('logging-in');

                     if (MV.MVAF_Core.Platform.Login () == false)
                     {
                        MV.MVAF_Core.Platform.Open ('main_home');
                     }
                  },
                  0
               );
               break;

            case this.Container.eSTATE.READY_AUTHENTICATE:
               this.Swap_Access (this.Tray.sContact);
               break;
         }
      }
      else if (pNotice.pCreator == this.Tray)
      {
         if (this.ReadyState () == this.eSTATE.NOTREADY)
         {
            if (this.Tray.ReadyState () == this.Tray.eSTATE.READY)
            {
               this.jTray.show ();
               $('body').removeClass ('logging-in');

               this.ReadyState (this.eSTATE.READY);
            }
         }
      }
   }

/*******************************************************************************************************************************
**                                                         Tray Events                                                        **
*******************************************************************************************************************************/

   onCancel_Tray (pNotice, acToken64U_Security, bPublic)
   {
      let Tray = pNotice.pData;

      if (Tray instanceof (MV.MVUA_Tray.Login.ACCESS))
      {
         g_pRP1Conn.pLnG.pSession.Authenticate ();

         setTimeout (this.Swap_Login.bind (this), 0);
      }
   }

   onSuccess_Tray (pNotice, acToken64U_Security, bPublic)
   {
      let Tray = pNotice.pData;

      if (Tray instanceof (MV.MVUA_Tray.Login.ACCESS))
      {
         g_pRP1Conn.pLnG.pSession.Authenticate (Tray.bPublic);
      }
      else if (Tray instanceof (MV.MVUA_Tray.Login.RESET_DEVICE))
      {
         setTimeout (this.Swap_Landing.bind (this), 0);
      }
      else if (Tray instanceof (MV.MVUA_Tray.Login.LANDING))
      {
         setTimeout (this.Swap_Login.bind (this), 0);
      }
   }

   onForgot_Tray (pNotice)
   {
      let Tray = pNotice.pData;

      if (Tray instanceof (MV.MVUA_Tray.Login.LOGIN))
      {
         setTimeout (g_pApp.SetUrl.bind (g_pApp, 'my', 'reset_password?return=' + document.location.href), 0);
      }
      else if (Tray instanceof (MV.MVUA_Tray.Login.ACCESS))
      {
         setTimeout (this.Swap_Reset.bind (this), 0);
      }
   }

   onSignUp_Tray (pNotice)
   {
      let Tray = pNotice.pData;

      if (Tray instanceof (MV.MVUA_Tray.Login.LOGIN))
      {
         setTimeout (g_pApp.SetUrl.bind (g_pApp, 'my', 'signup?return=' + document.location.href), 0);
      }
   }
}
