
const MV = new class
{
   constructor ()
   {
      this.asSrc = [];
   }

   Library (sID, sCopyright, sTitle, sVersion)
   {
      return new class
      {
         constructor (sID, sCopyright, sTitle, sVersion)
         {
            this.sID       = sID;
            this.Copyright = sCopyright;
            this.Title     = sTitle;
            this.Version   = sVersion;

            this.Const     = {};
            this.Enum      = {};
            this.Class     = {};
            this.Source    = {};
            this.Model     = {};
            this.Service   = {};
            this.Package   = {};

            MV.asSrc[sID]  = this;
         }

         Install (pCore) { return true; };
         Unstall (pCore) {};
      }
      (sID, sCopyright, sTitle, sVersion);
   }
}
();

MV.MVMF = MV.Library ('MVMF', 'Copyright 2014-2024 Metaversal Corporation. All rights reserved.', 'Metaversal Model Foundation', '0.23.30');

MV.MVMF.Const.BANK_NULL        = 0;
MV.MVMF.Const.OBJECTIX_NULL    = 0;
MV.MVMF.Const.OBJECTIX_MAX     = 0x0000FFFFFFFFFFFC;
MV.MVMF.Const.OBJECTIX_LAST    = 0x0000FFFFFFFFFFFD;
MV.MVMF.Const.OBJECTIX_ERROR   = 0x0000FFFFFFFFFFFE;
MV.MVMF.Const.OBJECTIX_INVALID = 0x0000FFFFFFFFFFFF;



MV.MVMF.CRC32_String = function (dwCRC32, sBuffer)
{
   let i;

   dwCRC32 = (dwCRC32 ^ (-1)) >>> 0;

   for (i=0; i<sBuffer.length; i++)
      dwCRC32 = MV.MVMF.CRC32_String.dwCRC32_Table[(dwCRC32 ^ sBuffer.charCodeAt (i)) & 0xFF] ^ (dwCRC32 >>> 8);

   return (dwCRC32 ^ (-1)) >>> 0;
}

MV.MVMF.CRC32_String.dwCRC32_Table = [];

for (let i=0; i<256; i++)
{
   let j, k;

   for (k=i, j=0; j<8; j++)
      k = (k & 1) ? (0xEDB88320 ^ (k >>> 1)) : (k >>> 1);

   MV.MVMF.CRC32_String.dwCRC32_Table[i] = (k >>> 0);
}

MV.MVMF.FINGERPRINT = class
{
   aBrand_Browser =
   {
      'chrome'     : 1,
      'firefox'    : 2,
      'safari'     : 3,
      'opera'      : 4,
      'msie'       : 0,
      'trident'    : 0,
      'unknown'    : 0xFF,
   };

   aProduct_System =
   {
      0:
      {
         '10.0'        : 12,
         '6.3'         : 11,
         '6.2'         : 10,
         '6.1'         :  9,
         '6.0'         :  6,
         '5.2'         :  4,
         '5.1'         :  3,
         '10'          : 12,
         '8.1'         : 11,
         '8'           : 10,
         '7'           :  9,
         'Vista'       :  6,
         'Server 2003' :  4,
         'XP'          :  3,
         '2000'        :  3,
         'ME'          :  3,
         '98'          :  3,
         '95'          :  3,
         'NT 4.0'      :  3,
         'CE'          :  3,
         '3.11'        :  3,
      },

      1:
      {
         'mac os'      :  0,
         'mac os 8'    :  0,
         'mac os 9'    :  1,
         'mac os x'    :  2,
      }
   };

   aBrand_System =
   {
      'windows'    :  0,
      'windows nt' :  0,
      'macintosh'  :  1,
      'mac os'     :  1,
      'mac os 8'   :  1,
      'mac os 9'   :  1,
      'mac os x'   :  1,
      'linux'      :  2,
      'android'    :  3,
      'ios'        :  4,
   };

   constructor ()
   {
      if (typeof navigator == 'undefined')
      {

         this.bBrowser_Brand       = 255;
         this.asBrowser_Version    = [ 0, 0, 0, 0 ];

         this.bSystem_Brand        = 255;
         this.bSystem_Product      = 255;
         this.bSystem_Type         = 255;
         this.asSystem_Version     = [ 0, 0 ];

         this.wScreen_Pixel_Width  = 0;
         this.wScreen_Pixel_Height = 0;
         this.wScreen_Pixel_Depth  = 0;

         this.dwHash_Fonts         = 0;
         this.dwHash_Plugins       = 0;

         this.dwHash_Canvas        = 0;
         this.dwHash_UserAgent     = 0;
      }
      else
      {
         this.screen    = screen;
         this.navigator = navigator;
         this.document  = document;

         let System_Info = this.GetSystemInfo ();

         this.bBrowser_Brand       = this.aBrand_Browser[ System_Info.browser ] ? this.aBrand_Browser[ System_Info.browser ] : this.aBrand_Browser['unknown'];
         this.asBrowser_Version    = System_Info.aVersion_Browser;

         this.bSystem_Brand        = this.aBrand_System [ System_Info.os ];
         let sProduct              = this.bSystem_Brand == 1 ? System_Info.os : System_Info.systemVersion;
         this.bSystem_Product      = (this.bSystem_Brand in this.aProduct_System  &&  sProduct in this.aProduct_System[this.bSystem_Brand]) ?  this.aProduct_System[this.bSystem_Brand][sProduct] : 0xFF;
         this.bSystem_Type         = this.navigator.userAgent.indexOf ('WOW64') > 0 ? 1 : 0xFF;
         this.asSystem_Version     = System_Info.aVersion_System;

         this.wScreen_Pixel_Width  = 0;
         this.wScreen_Pixel_Height = 0x0000FFFF & MV.MVMF.CRC32_String (0, Intl.DateTimeFormat ().resolvedOptions ().timeZone);
         this.wScreen_Pixel_Depth  = this.screen.pixelDepth;

         this.dwHash_Fonts         = 0;
         this.dwHash_Plugins       = MV.MVMF.CRC32_String (0, this.GetInstalledPluggins ().join (','));

         this.dwHash_Canvas        = MV.MVMF.CRC32_String (0, this.GetCanvasFingerprint ());
         this.dwHash_UserAgent     = MV.MVMF.CRC32_String (0, this.navigator.userAgent);
      }
   }

   destructor ()
   {
      return null;
   }

   GetSystemInfo ()
   {
      let unknown = '-';

      let nVer = this.navigator.appVersion;
      let nAgt = this.navigator.userAgent;
      let browser = this.navigator.appName;
      let browserVersion = '' + parseFloat (this.navigator.appVersion);
      let majorVersion = parseInt (this.navigator.appVersion, 10);
      let nameOffset, verOffset, ix;

      if ((verOffset = nAgt.indexOf ('Opera')) != -1)
      {
         browser = 'opera';
         browserVersion = nAgt.substring (verOffset + 6);
         if ((verOffset = nAgt.indexOf ('Version')) != -1)
            browserVersion = nAgt.substring (verOffset + 8);
      }

      if ((verOffset = nAgt.indexOf ('OPR')) != -1)
      {
         browser = 'opera';
         browserVersion = nAgt.substring (verOffset + 4);
      }

      else if ((verOffset = nAgt.indexOf ('MSIE')) != -1)
      {
         browser = 'msie';
         browserVersion = nAgt.substring (verOffset + 5);
      }

      else if ((verOffset = nAgt.indexOf ('Chrome')) != -1)
      {
         browser = 'chrome';
         browserVersion = nAgt.substring (verOffset + 7);
      }

      else if ((verOffset = nAgt.indexOf ('Safari')) != -1)
      {
         browser = 'safari';
         browserVersion = nAgt.substring (verOffset + 7);
         if ((verOffset = nAgt.indexOf ('Version')) != -1)
            browserVersion = nAgt.substring (verOffset + 8);
      }

      else if ((verOffset = nAgt.indexOf ('Firefox')) != -1)
      {
         browser = 'firefox';
         browserVersion = nAgt.substring (verOffset + 8);
      }

      else if (nAgt.indexOf ('Trident/') != -1)
      {
         browser = 'msie';
         browserVersion = nAgt.substring (nAgt.indexOf ('rv:') + 3);
      }

      else if ((nameOffset = nAgt.lastIndexOf (' ') + 1) < (verOffset = nAgt.lastIndexOf ('/')))
      {
         browser = nAgt.substring (nameOffset, verOffset);
         browserVersion = nAgt.substring (verOffset + 1);
         if (browser.toLowerCase () == browser.toUpperCase ())
            browser = this.navigator.appName;
      }

      if ((ix = browserVersion.indexOf (';')) != -1) browserVersion = browserVersion.substring (0, ix);
      if ((ix = browserVersion.indexOf (' ')) != -1) browserVersion = browserVersion.substring (0, ix);
      if ((ix = browserVersion.indexOf (')')) != -1) browserVersion = browserVersion.substring (0, ix);

      majorVersion = parseInt ('' + browserVersion, 10);
      if (isNaN (majorVersion))
      {
         browserVersion = '' + parseFloat (this.navigator.appVersion);
         majorVersion = parseInt (this.navigator.appVersion, 10);
      }

      let mobile = /Mobile|mini|Fennec|Android|iP(ad|od|hone)/.test (nVer);

      let cookieEnabled = (this.navigator.cookieEnabled) ? true : false;

      if (typeof this.navigator.cookieEnabled == 'undefined' && !cookieEnabled)
      {
         this.document.cookie = 'testcookie';
         cookieEnabled = (this.document.cookie.indexOf ('testcookie') != -1) ? true : false;
      }

      let os = unknown;
      let clientStrings =
      [
         {s: 'Windows 10',           r: /(Windows 10.0|Windows NT 10.0)/                                               },
         {s: 'Windows 8.1',          r: /(Windows 8.1|Windows NT 6.3)/                                                 },
         {s: 'Windows 8',            r: /(Windows 8|Windows NT 6.2)/                                                   },
         {s: 'Windows 7',            r: /(Windows 7|Windows NT 6.1)/                                                   },
         {s: 'Windows 6',            r: /Windows NT 6.0/                                                               },
         {s: 'Windows 5.2',          r: /Windows NT 5.2/                                                               },
         {s: 'Windows 5.1',          r: /(Windows NT 5.1|Windows XP)/                                                  },
         {s: 'Windows 5.0',          r: /(Windows NT 5.0|Windows 2000)/                                                },
         {s: 'Windows 4.9',          r: /(Win 9x 4.90|Windows ME)/                                                     },
         {s: 'Windows 4.8',          r: /(Windows 98|Win98)/                                                           },
         {s: 'Windows 4.5',          r: /(Windows 95|Win95|Windows_95)/                                                },
         {s: 'Windows 4.0',          r: /(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/                                   },
         {s: 'Windows 3.2',          r: /Windows CE/                                                                   },
         {s: 'Windows 3.11',         r: /Win16/                                                                        },
         {s: 'Android',              r: /Android/                                                                      },
         {s: 'Open BSD',             r: /OpenBSD/                                                                      },
         {s: 'Sun OS',               r: /SunOS/                                                                        },
         {s: 'Linux',                r: /(Linux|X11)/                                                                  },
         {s: 'iOS',                  r: /(iPhone|iPad|iPod)/                                                           },
         {s: 'Mac OS X',             r: /Mac OS X/                                                                     },
         {s: 'Mac OS',               r: /(MacPPC|MacIntel|Mac_PowerPC|Macintosh)/                                      },
         {s: 'QNX',                  r: /QNX/                                                                          },
         {s: 'UNIX',                 r: /UNIX/                                                                         },
         {s: 'BeOS',                 r: /BeOS/                                                                         },
         {s: 'OS/2',                 r: /OS\/2/                                                                        },
         {s: 'Search Bot',           r: /(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/ }
      ];

      for (let id in clientStrings)
      {
         let cs = clientStrings[id];
         if (cs.r.test (nAgt))
         {
            os = cs.s;
            break;
         }
      }

      let systemVersion = unknown;

      if (/Windows/.test (os))
      {
         systemVersion = /Windows (.*)/.exec (os)[1];
         os = 'Windows';
      }

      switch (os)
      {
         case 'Mac OS X':
            systemVersion = /Mac OS X (10[\.\_\d]+)/.exec (nAgt)[1];
            break;

         case 'Android':
            systemVersion = /Android ([\.\_\d]+)/.exec (nAgt)[1];
            break;

         case 'iOS':
            systemVersion = /OS (\d+)_(\d+)_?(\d+)?/.exec (nVer);
            systemVersion = systemVersion[1] + '.' + systemVersion[2] + '.' + (systemVersion[3] | 0);
            break;
      }

      let aVersion_Browser = [];
      browserVersion.split ('.').forEach (function (val) { aVersion_Browser.push (parseInt (val)); });
      while (aVersion_Browser.length < 4)
         aVersion_Browser.push (0);

      let aVersion_System = [];
   if (systemVersion != unknown)
      systemVersion.split ('.').forEach (function (val) { aVersion_System.push (parseInt (val)); });
      while (aVersion_System.length < 2)
         aVersion_System.push (0);

      return {
               os                   : os.toLocaleLowerCase (),
               mobile               : mobile,
               browser              : browser,
               browserVersion       : browserVersion,
               systemVersion        : systemVersion.toLocaleLowerCase (),
               browserMajorVersion  : majorVersion,
               cookies              : cookieEnabled,

               aVersion_Browser     : aVersion_Browser,
               aVersion_System      : aVersion_System,
            };
   }

   GetInstalledPluggins ()
   {
      let aPluggin_Installed = [];

      for (let i=0; i<this.navigator.plugins.length; i++)
         aPluggin_Installed.push (this.navigator.plugins[i].name);

      return aPluggin_Installed;
   }

   GetCanvasFingerprint ()
   {
      let Canvas = this.document.createElement ('canvas');
      let ctx = Canvas.getContext ('2d');
      let txt = 'MVMF Service';

      ctx.textBaseline  = "top";
      ctx.font          = "16px 'Arial'";
      ctx.textBaseline  = "alphabetic";
      ctx.rotate          (.05);
      ctx.fillStyle     = "#f60";
      ctx.fillRect        (125, 1, 62, 20);
      ctx.fillStyle     = "#069";
      ctx.fillText        (txt, 2, 15);
      ctx.fillStyle     = "rgba(102, 200, 0, 0.7)";
      ctx.fillText        (txt, 4, 17);
      ctx.shadowBlur    = 10;
      ctx.shadowColor   = "blue";
      ctx.fillRect        (-20, 10, 234, 5);

      return Canvas.toDataURL ();
   }
}

MV.MVMF.STORAGE = class
{
   constructor ()
   {
      this.apZone = {};

      this.Zone ('Origin');

      if (window && window.addEventListener)
         window.addEventListener ("storage", this.Transponder.bind (this), false);
   }

   destructor ()
   {
      return null;
   }

   Zone (sZone)
   {
      if (this.apZone[sZone] === undefined)
         this.apZone[sZone] = new MV.MVMF.STORAGE.ZONE (this, sZone);

      return this.apZone[sZone];
   }

   Transponder (event)
   {
      if (!event)
         event = window.event;

      if (event.newValue)
      {
         try
         {
            var pData = JSON.parse (event.newValue);

            switch (event.key)
            {
               case 'sessionStorage_Get':
                  for (var sZone in pData)
                     for (var sName in pData[sZone])
                        pData[sZone][sName] = this[sZone].Get (sName, false);

                  localStorage.setItem    ('sessionStorage_Set', JSON.stringify (pData));
                  localStorage.removeItem ('sessionStorage_Set');
                  break;

               case 'sessionStorage_Set':
                  for (var sZone in pData)
                     if (pData[sZone] !== null)
                     {
                        for (var sName in pData[sZone])
                           if (pData[sZone][sName] !== null)
                              this[sZone].Set (sName, pData[sZone][sName], false);
                           else this[sZone].Remove (sName, false);
                     }
                     else this[sZone].Clear (false);
                  break;
            }
         }
         catch (e)
         {
         }
      }
   }
}

MV.MVMF.STORAGE.ZONE = class
{
   constructor (Storage, sZone)
   {
      this.Storage = Storage;
      this.sZone = sZone;
   }

   #MakeName (sName)
   {
      return (this.sZone != 'Origin' ? this.sZone + '__' : '') + sName;
   }

   #Sync_Get (sName, bPermanent)
   {
      if (!bPermanent)
      {
         let pData = {};

         pData[this.sZone]        = {};
         pData[this.sZone][sName] = null;

         localStorage.setItem    ('sessionStorage_Get', JSON.stringify (pData));
         localStorage.removeItem ('sessionStorage_Get');
      }
   }

   #Sync_Set (sName, sValue, bPermanent)
   {
      if (!bPermanent)
      {
         let pData = {};

         if (sName)
         {
            pData[this.sZone]        = {};
            pData[this.sZone][sName] = sValue;
         }
         else pData[this.sZone] = null;

         localStorage.setItem    ('sessionStorage_Set', JSON.stringify (pData));
         localStorage.removeItem ('sessionStorage_Set');
      }
   }

   Length (bPermanent)
   {
      let Storage = bPermanent ? localStorage : sessionStorage;

      return Storage.length ();
   }

   Name (nIndex, bPermanent)
   {
      let Storage = bPermanent ? localStorage : sessionStorage;

      return Storage.key (nIndex);
   }

   Clear (bPermanent, bSync)
   {
      let Storage = bPermanent ? localStorage : sessionStorage;

      Storage.clear ();

      if (bSync)
         this.#Sync_Set (null, null, bPermanent);
   }

   Sync (sName)
   {
      this.#Sync_Get (sName, false);
   }

   Get (sName, bPermanent)
   {
      let sValue = null;

      if (bPermanent === false  ||  bPermanent == null)
         sValue = sessionStorage.getItem (this.#MakeName (sName));

      if (sValue == null)
         if (bPermanent === true  ||  bPermanent == null)
            sValue = localStorage.getItem (this.#MakeName (sName));

      return sValue;
   }

   Set (sName, sValue, bPermanent, bSync)
   {
      let Storage = bPermanent ? localStorage : sessionStorage;

      Storage.setItem (this.#MakeName (sName), sValue);

      if (bSync)
         this.#Sync_Set (sName, sValue, bPermanent);
   }

   Remove (sName, bPermanent, bSync)
   {
      if (bPermanent === true  ||  bPermanent == null)
         localStorage.removeItem (this.#MakeName (sName));
      if (bPermanent === false ||  bPermanent == null)
         sessionStorage.removeItem (this.#MakeName (sName));

      if (bSync)
         this.#Sync_Set (sName, null, bPermanent);

      return null;
   }
}

MV.MVMF.COOKIE = class
{
   static NEVER = 365 * 4 + 1;

   NEVER = MV.MVMF.COOKIE.NEVER;

   constructor (sZone)
   {
      if (!sZone)
         sZone = window.location.hostname.split ('.').reverse ().slice (0, 2).reverse ().join ('.');

      this.sExpired  = ';expires=Thu, 01 Jan 1970 00:00:01 GMT';
      this.sPath     = ';path=/';
      this.sZone     = ';domain=.' + sZone;
      this.sSameSite = ';samesite=strict';

      this.apZone = {};

      this.Zone ('Origin');

   }

   destructor ()
   {
      return null;
   }

   Zone (sZone)
   {
      if (this.apZone[sZone] === undefined)
         this.apZone[sZone] = new MV.MVMF.COOKIE.ZONE (this, sZone);

      return this.apZone[sZone];
   }
}

MV.MVMF.COOKIE.ZONE = class
{
   constructor (pCookie, sZone)
   {
      this.pCookie = pCookie;
      this.sZone   = sZone;
   }

   destructor ()
   {
      return null;
   }

   #MakeName (sName)
   {
      return (this.sZone != 'Origin' ? this.sZone + '__' : '') + sName;
   }

   Set (sName, sValue, nDays, nHours)
   {
      let dtExpires;

      if (nDays instanceof Date)
         dtExpires = nDays;
      else
      {
         nDays  = nDays  || 0;
         nHours = nHours || 0;

         if (nDays || nHours)
            dtExpires = new Date (Date.now () + ((nDays * 24 + nHours) * 60 * 60 * 1000));
      }

      let sExpires = dtExpires ? ';expires=' + dtExpires.toUTCString () : '';

      document.cookie = this.#MakeName (sName) + '=' + (sValue || '') + sExpires + this.pCookie.sPath + this.pCookie.sZone + this.pCookie.sSameSite + ';';
   }

   SetJSON (sName, pValue, nDays, nHours)
   {
      let sValue = JSON.stringify (pValue);

      return this.Set (sName, sValue, nDays, nHours);
   }

   Get (sName)
   {
      sName = this.#MakeName (sName) + '=';

      let i, asCookie = document.cookie.split (';');

      for (i=0; i<asCookie.length; i++)
      {
         let sCookie = asCookie[i];

         while (sCookie.charAt (0) == ' ')
            sCookie = sCookie.substring (1, sCookie.length);

         if (sCookie.indexOf (sName) == 0)
            return sCookie.substring (sName.length, sCookie.length);
      }

      return null;
   }

   GetJSON (sName)
   {
      let sValue = this.Get (sName);

      return sValue ? JSON.parse (sValue) : undefined;
   }

   Remove (sName)
   {
      document.cookie = this.#MakeName (sName) + '=' + this.pCookie.sExpired + this.pCookie.sPath + this.pCookie.sZone + this.pCookie.sSameSite + ';';

      return null;
   }
}

MV.MVMF.REGISTRY = class
{
   constructor (sZone)
   {
      if (!sZone)
         sZone = window.location.hostname.split ('.').reverse ().slice (0, 2).reverse ().join ('.');

      this.sExpired  = ';expires=Thu, 01 Jan 1970 00:00:01 GMT';
      this.sPath     = ';path=/';
      this.sZone     = ';domain=.' + sZone;
      this.sSameSite = ';samesite=strict';

      this.apZone = {};

      this.Zone ('Origin');

   }

   destructor ()
   {
      return null;
   }

   Zone (sZone)
   {
      if (this.apZone[sZone] === undefined)
         this.apZone[sZone] = new MV.MVMF.REGISTRY.ZONE (this, sZone);

      return this.apZone[sZone];
   }
}

MV.MVMF.REGISTRY.ZONE = class
{
   constructor (pRegistry, sZone)
   {
      this.pRegistry = pRegistry;
      this.sZone     = sZone;
   }

   destructor ()
   {
      return null;
   }

   #MakeName (sName)
   {
      return (this.sZone != 'Origin' ? this.sZone + '__' : '') + sName;
   }

   Set (sName, sValue, bPermanent)
   {
      let dtExpires;

      if (bPermanent)
      {
         let nDays  = 365 * 4 + 1;

         dtExpires = new Date (Date.now () + ((nDays * 24) * 60 * 60 * 1000));
      }

      let sExpires = dtExpires ? ';expires=' + dtExpires.toUTCString () : '';

      document.cookie = this.#MakeName (sName) + '=' + (sValue || '') + sExpires + this.pRegistry.sPath + this.pRegistry.sZone + this.pRegistry.sSameSite + ';';
   }

   SetJSON (sName, pValue, bPermanent)
   {
      let sValue = JSON.stringify (pValue);

      return this.Set (sName, sValue, bPermanent);
   }

   Get (sName)
   {
      sName = this.#MakeName (sName) + '=';

      let i, asCookie = document.cookie.split (';');

      for (i=0; i<asCookie.length; i++)
      {
         let sCookie = asCookie[i];

         while (sCookie.charAt (0) == ' ')
            sCookie = sCookie.substring (1, sCookie.length);

         if (sCookie.indexOf (sName) == 0)
            return sCookie.substring (sName.length, sCookie.length);
      }

      return null;
   }

   GetJSON (sName)
   {
      let sValue = this.Get (sName);

      return sValue ? JSON.parse (sValue) : undefined;
   }

   Remove (sName)
   {
      document.cookie = this.#MakeName (sName) + '=' + this.pRegistry.sExpired + this.pRegistry.sPath + this.pRegistry.sZone + this.pRegistry.sSameSite + ';';

      return null;
   }
}



/*

MV.MVMF.FINGERPRINT = class
{
   constructor ()
   {
      this.bBrowser_Brand       = 255;
      this.asBrowser_Version    = [ 0, 0, 0, 0 ];

      this.bSystem_Brand        = 255;
      this.bSystem_Product      = 255;
      this.bSystem_Type         = 255;
      this.asSystem_Version     = [ 0, 0 ];

      this.wScreen_Pixel_Width  = 0;
      this.wScreen_Pixel_Height = 0;
      this.wScreen_Pixel_Depth  = 0;

      this.dwHash_Fonts         = 0;
      this.dwHash_Plugins       = 0;

      this.dwHash_Canvas        = 0;
      this.dwHash_UserAgent     = 0;
   }

   destructor ()
   {
      return null;
   }
}

const fs = require ('fs');

MV.MVMF.STORAGE = class
{
   constructor ()
   {
      if (fs.existsSync ('mvmf.json'))
         this.content = JSON.parse (fs.readFileSync ('mvmf.json'));
      else this.content = {};

      this.apZone = {};

      this.Zone ('Origin');
   }

   destructor ()
   {
      return null;
   }

   Save ()
   {
      fs.writeFileSync ('mvmf.json', JSON.stringify (this.content));
   }

   Zone (sZone)
   {
      if (this.apZone[sZone] === undefined)
         this.apZone[sZone] = new MV.MVMF.STORAGE.ZONE (this, sZone);

      return this.apZone[sZone];
   }
}

MV.MVMF.STORAGE.ZONE = class
{
   constructor (Storage, sZone)
   {
      this.Storage = Storage;
      this.sZone = sZone;

      if (Storage.content[sZone] === undefined)
      {
         Storage.content[sZone] = {};
         this.Storage.Save ();
      }

      this.Data = Storage.content[sZone];
   }

   Length ()
   {
      return 0;
   }

   Name (nIndex)
   {
      return null;
   }

   Clear ()
   {
      Storage.content[sZone] = {};
      this.Storage.Save ();
   }

   Get (sName)
   {
      return this.Data[sName];
   }

   Set (sName, sValue)
   {
      this.Data[sName] = sValue;
      this.Storage.Save ();
   }

   Remove (sName)
   {
      delete this.Data[sName];
      this.Storage.Save ();

      return null;
   }
}

MV.MVMF.COOKIE = class
{
   static NEVER = 365 * 4 + 1;

   NEVER = MV.MVMF.COOKIE.NEVER;

   constructor ()
   {
      if (fs.existsSync ('mvmf2.json'))
         this.content = JSON.parse (fs.readFileSync ('mvmf2.json'));
      else this.content = {};

      this.apZone = {};

      this.Zone ('Origin');
   }

   destructor ()
   {
      return null;
   }

   Save ()
   {
      fs.writeFileSync ('mvmf2.json', JSON.stringify (this.content));
   }

   Zone (sZone)
   {
      if (this.apZone[sZone] === undefined)
         this.apZone[sZone] = new MV.MVMF.STORAGE.ZONE (this, sZone);

      return this.apZone[sZone];
   }
}

MV.MVMF.REGISTRY = class
{
   constructor ()
   {
      if (fs.existsSync ('mvmf2.json'))
         this.content = JSON.parse (fs.readFileSync ('mvmf2.json'));
      else this.content = {};

      this.apZone = {};

      this.Zone ('Origin');
   }

   destructor ()
   {
      return null;
   }

   Save ()
   {
      fs.writeFileSync ('mvmf2.json', JSON.stringify (this.content));
   }

   Zone (sZone)
   {
      if (this.apZone[sZone] === undefined)
         this.apZone[sZone] = new MV.MVMF.STORAGE.ZONE (this, sZone);

      return this.apZone[sZone];
   }
}

*/

MV.MVMF.COLLECTION = class
{
   #pISort;
   #pICompare;
   #pIEnum;
   #apPair;
   #apEnum;

   constructor (pISort, pICompare)
   {
      this.#pISort    = pISort    || null;
      this.#pICompare = pICompare || null;

      if (this.#pISort == null  &&  this.#pICompare == null)
         this.#pISort = new MV.MVMF.COLLECTION.ISORT ();

      this.#apPair    = [];
      this.#apEnum    = [];

   }

   destructor ()
   {

      if (this.#apEnum.length > 0)
      {
         console.log ('destructor: Failed to close ' + this.#apEnum.length + ' enumerators of collection instance: ', this);
         debugger;
      }

      this.#apEnum    = null;
      this.#apPair    = null;

      this.#pICompare = null;
      this.#pISort    = null;

      return null;
   }

   #Index_Sort (key, bMatch)
   {
      let nIndex = 0;
      let nMin   = 0;
      let nMax   = this.#apPair.length;
      let nCompare;

      while (nMin < nMax)
      {
         nIndex = Math.floor ((nMin + nMax) / 2);

         nCompare = this.#pISort.Sort (key, this.#apPair[nIndex].key);

         if (nCompare < 0)
            nMax = nIndex;
         else if (nCompare > 0)
            nMin = nIndex = nIndex + 1;
         else nMin = nMax = nIndex;
      }

      if (nIndex < this.#apPair.length)
      {
         nCompare = this.#pISort.Sort (key, this.#apPair[nIndex].key);

         if (bMatch == false)
            nIndex = nCompare == 0 ? -1 : nIndex;
         else nIndex = nCompare == 0 ? nIndex : this.#apPair.length;
      }

      return nIndex;
   }

   #Index_Compare (key)
   {
      let nIndex;

      for (nIndex=0; nIndex<this.#apPair.length; nIndex++)
         if (this.#pICompare.Compare (key, this.#apPair[nIndex].pValue) != false)
            break;

      return nIndex;
   }

   #Index (key)
   {
      let nIndex = -1;

      if (this.#pICompare != null  ||  this.#pISort.IsNull (key) == false)
      {
         if (this.#pICompare == null)
            nIndex = this.#Index_Sort (key, true);
         else nIndex = this.#Index_Compare (key);

         if (nIndex == this.#apPair.length)
            nIndex = -1;
      }

      return nIndex;
   }

   Add (key, pValue)
   {
      let bResult = false;
      let nIndex, pPair, nEnum;

         if (this.#pICompare != null  ||  this.#pISort.IsNull (key) == false)
         {
            if (pValue != null)
            {
               if (this.#pICompare == null)
                  nIndex = this.#Index_Sort (key, false);
               else if (this.#pICompare.Compare (key, pValue) != false)
                  nIndex = this.#Index_Compare (key);
               else nIndex = -1;

               if (nIndex >= 0)
               {
                  pPair = new MV.MVMF.COLLECTION.PAIR (key, pValue);

                  this.#apPair.splice (nIndex, 0, pPair);

                  for (nEnum=0; nEnum<this.#apEnum.length; nEnum++)
                     if (this.#apEnum[nEnum].nIndex > nIndex)
                        this.#apEnum[nEnum].nIndex++;

                  bResult = true;
               }
            }
         }

      return bResult;
   }

   Remove (key)
   {
      let pValue = null;
      let nIndex, pPair, nEnum;

         if ((nIndex = this.#Index (key)) >= 0)
         {
            pPair = this.#apPair[nIndex];

            pValue = pPair.pValue;

            this.#apPair.splice (nIndex, 1);

            pPair.destructor ();

            for (nEnum=0; nEnum<this.#apEnum.length; nEnum++)
               if (this.#apEnum[nEnum].nIndex > nIndex)
                  this.#apEnum[nEnum].nIndex--;
         }

      return pValue;
   }

   Length ()
   {
      let nLength;

         nLength = this.#apPair.length;

      return nLength;
   }

   Exists (key)
   {
      let nIndex;

         nIndex = this.#Index (key);

      return nIndex;
   }

   Get (key, bLock)
   {
      let pValue = null;
      let nIndex;

         if ((nIndex = this.#Index (key)) >= 0)
            pValue = this.#apPair[nIndex].pValue;

      return pValue;
   }

   Index (nIndex)
   {
      let pValue = null;

         if (nIndex < this.#apPair.length)
            pValue = this.#apPair[nIndex].pValue;

      return pValue;
   }

   Find (pIFind)
   {
      let pValue = null;
      let nIndex;

         for (nIndex=0; nIndex<this.#apPair.length; nIndex++)
            if (pIFind.Find (this.#apPair[nIndex].pValue) != false)
               break;

         if (nIndex < this.#apPair.length)
            pValue = this.#apPair[nIndex].pValue;

      return pValue;
   }

   Capture ()
   {

   }

   Release ()
   {

   }

   Enum_Begin ()
   {
      let pEnum;

         pEnum = { nIndex: 0 };

         this.#apEnum.push (pEnum);

      return pEnum;
   }

   Enum_Next (pEnum)
   {
      let pValue = null;

         if (pEnum.nIndex < this.#apPair.length)
         {
            pValue = this.#apPair[pEnum.nIndex].pValue;

            pEnum.nIndex++;
         }

      return pValue;
   }

   Enum_End (pEnum)
   {
      let nEnum;

         if ((nEnum = this.#apEnum.indexOf (pEnum)) >= 0)
         {
            this.#apEnum.splice (nEnum, 1);

         }

      return pEnum;
   }
}

MV.MVMF.COLLECTION.PAIR = class
{
   constructor (key, pValue)
   {
      this.key    = key;
      this.pValue = pValue;
   }

   destructor ()
   {
      return null;
   }
}

MV.MVMF.COLLECTION.ISORT = class
{
   Sort   (key_A, key_B) { return key_A < key_B ? -1 : (key_A > key_B ? 1 : 0); }
   IsNull (key)          { return (key == null || key == ""); }
}

MV.MVMF.COLLECTION.ICOMPARE = class
{
   Compare (key, pValue) { return false; }
}

MV.MVMF.COLLECTION.IFIND = class
{
   Find (pValue) {}
}

MV.MVMF.SHAREDOBJECT = class
{
   #cpInstance;

   constructor ()
   {
      this.#cpInstance = new MV.MVMF.COLLECTION ();
   }

   destructor ()
   {
      let nLength = this.#cpInstance.Length ();

      if (nLength > 0)
      {
         console.log ('destructor: Failed to close ' + nLength + ' objects of sharedobject instance: ', this);
         debugger;
      }

      this.#cpInstance.destructor ();

      return null;
   }

   #Create (sKey, pIReference, pParam)
   {
      let pObject;
      let pInstance;

      if (pObject = pIReference.Create (pParam))
      {
         pInstance = new MV.MVMF.SHAREDOBJECT.INSTANCE (pObject, pParam);

         if (this.#cpInstance.Add (sKey, pInstance) == false)
         {
            pInstance.destructor ();
            pObject  .destructor ();

            pObject = null;
         }
      }

      return pObject;
   }

   #Destroy (sKey)
   {
      let pParam = null;
      let pInstance;
      let pObject;

      if (pInstance = this.#cpInstance.Remove (sKey))
      {
         pObject = pInstance.pObject;
         pParam  = pInstance.pParam;

         pInstance = pInstance.destructor ();
         pObject   = pObject  .destructor ();
      }

      return pParam;
   }

   Open (pIReference, pParam)
   {
      let sKey = '' + pIReference.Key ();

      let pObject = null;
      let pInstance;

      pInstance = this.#cpInstance.Get (sKey, true);
      {
         if (pInstance == null)
         {
            pObject = this.#Create (sKey, pIReference, pParam);
         }
         else
         {
            pInstance.Increment ();

            pObject = pInstance.pObject;
         }
      }
      this.#cpInstance.Release ();

      return pObject;
   }

   Close (sKey)
   {
      let pParam = null;
      let pInstance;

      pInstance = this.#cpInstance.Get (sKey, true);
      {
         if (pInstance != null)
         {
            if (pInstance.Decrement () == 0)
            {
               pParam = this.#Destroy (sKey);
            }
            else pParam = undefined;
         }
      }
      this.#cpInstance.Release ();

      return pParam;
   }

   Length ()
   {
      return this.#cpInstance.Length ();
   }

   Exists (sKey)
   {
      return this.#cpInstance.Exists (sKey);
   }

   Param (sKey)
   {
      let pParam = null;
      let pInstance;

      if ((pInstance = this.#cpInstance.Get (sKey)) != null)
      {
         pParam = pInstance.pParam;

         this.#cpInstance.Release ();
      }

      return pParam;
   }

   Get (sKey)
   {
      let pObject = null;
      let pInstance;

      if ((pInstance = this.#cpInstance.Get (sKey)) != null)
      {
         pObject = pInstance.pObject;
      }

      return pObject;
   }

   Index (nIndex)
   {
      let pObject = null;
      let pInstance;

      if ((pInstance = this.#cpInstance.Index (nIndex)) != null)
      {
         pObject = pInstance.pObject;
      }

      return pObject;
   }

   Enum (pThis, fnCallback, pParam)
   {
      let pObject = null;
      let pEnum, bResult = true;
      let pInstance;

      if (pEnum = this.#cpInstance.Enum_Begin ())
      {
         while (bResult  &&  (pInstance = this.#cpInstance.Enum_Next (pEnum)) != null)
         {
            pObject = pInstance.pObject;

            if (bResult = fnCallback.call (pThis, pObject, pParam))
               this.#cpInstance.Release ();
         }

         this.#cpInstance.Enum_End (pEnum);
      }

      return pObject;
   }

   Release ()
   {
      this.#cpInstance.Release ();
   }
}

MV.MVMF.SHAREDOBJECT.INSTANCE = class
{
   #pObject;
   #pParam;

   #nCount = 1;

   constructor (pObject, pParam)
   {
      this.#pObject = pObject;
      this.#pParam  = pParam;
   }

   destructor ()
   {
      return null;
   }

   get pObject () { return this.#pObject; }
   get pParam  () { return this.#pParam;  }

   Increment ()
   {
      return ++this.#nCount;
   }

   Decrement ()
   {
      return --this.#nCount;
   }
}

MV.MVMF.SHAREDOBJECT.IREFERENCE = class
{
   #sID;

   constructor (sID)
   {
      this.#sID = sID;
   }

   destructor ()
   {
      return null;
   }

   UniqueId ()
   {
      return this.#sID;
   }

   Key ()
   {
      return '0';
   }

   Create (pParam)
   {
      return null;
   }
}

MV.MVMF.CORE = class
{
   #sopPlugin;
   #cpNamespace;
   #cpLnG;
   #pRegistry;

   constructor ()
   {
      this.#sopPlugin   = new MV.MVMF.SHAREDOBJECT ();
      this.#cpNamespace = new MV.MVMF.COLLECTION ();
      this.#cpLnG       = new MV.MVMF.COLLECTION (null, new MV.MVMF.LNG.ICOMPARE ());
      this.#pRegistry   = new MV.MVMF.REGISTRY    ();
   }

   destructor ()
   {
      this.#cpLnG       = this.#cpLnG        .destructor ();
      this.#cpNamespace = this.#cpNamespace  .destructor ();
      this.#sopPlugin   = this.#sopPlugin    .destructor ();
      this.#pRegistry   = this.#pRegistry    .destructor ();

      return null;
   }

   #Namespace_Add (sNamespace)
   {
      let pNamespace;

      pNamespace = this.#cpNamespace.Get (sNamespace, true);
      {
         if (pNamespace == null)
         {
            pNamespace = new MV.MVMF.CORE.NAMESPACE (sNamespace);

            if (this.#cpNamespace.Add (sNamespace, pNamespace))
            {

            }
            else pNamespace = pNamespace.destructor ();
         }
      }
      if (pNamespace == null)
      this.#cpNamespace.Release ();

      return pNamespace;
   }

   Require (sSrc_List, sID_Service, sNamespace)
   {
      let pRequire = new MV.MVMF.CORE.REQUIRE (sSrc_List, sID_Service, sNamespace);

      if (pRequire.Success () == false)
         pRequire = pRequire.destructor ();

      return pRequire;
   }

   Release (pRequire)
   {
      return pRequire.destructor ();
   }

   Plugin_Open (sSrc)
   {
      let pPlugin = null;
      let pLibrary, pIReference;

      pLibrary = MV.asSrc[sSrc];

      if (pLibrary)
      {
         pIReference = new MV.MVMF.PLUGIN.IREFERENCE (pLibrary.sID);

         this.#sopPlugin.Open (pIReference, pLibrary);

         pIReference.destructor ();

         if (pPlugin = this.#sopPlugin.Get (pLibrary.sID))
         {
            if (pPlugin.Install (MV.MVMF.Core))
            {

            }
            else pPlugin = this.Plugin_Close (pPlugin);

            this.#sopPlugin.Release ();
         }
      }

      return pPlugin;
   }

   Plugin_Close (pPlugin)
   {
      let sID;

      if (pPlugin)
      {
         sID = pPlugin.sID;

         if (pPlugin = this.#sopPlugin.Get (sID))
         {
            pPlugin.Unstall (MV.MVMF.Core);

            this.#sopPlugin.Release ();
         }

         this.#sopPlugin.Close (sID);

         pPlugin = null;
      }

      return pPlugin;
   }

   Plugin_Factory (sType, sID_Factory)
   {
      let pFactory = null;
      let asID, pPlugin;

      asID = sID_Factory.split ('/');

      if (asID.length == 2)
      {
         if (pPlugin = this.#sopPlugin.Get (asID[0]))
         {
            pFactory = pPlugin.Factory (sType, asID[1]);

            this.#sopPlugin.Release ();
         }
         else console.log ('Unknown plugin: ' + asID[0]);
      }

      return pFactory;
   }

   Namespace_Add (sNamespace)
   {

      return this.#Namespace_Add (sNamespace);
   }

   Namespace_Length ()
   {
      return this.#cpNamespace.Length ();
   }

   Namespace_Exists (sNamespace)
   {
      return this.#cpNamespace.Exists (sNamespace);
   }

   Namespace_Get (sNamespace)
   {
      return this.#cpNamespace.Get (sNamespace);
   }

   Namespace_Index (nIndex)
   {
      return this.#cpNamespace.Index (nIndex);
   }

   Namespace_Enum (pThis, fnCallback, pParam)
   {
      let pNamespace = null;
      let pEnum, bResult = true;

      if (pEnum = this.#cpNamespace.Enum_Begin ())
      {
         while (bResult  &&  (pNamespace = this.#cpNamespace.Enum_Next (pEnum)) != null)
            if (bResult = fnCallback.call (pThis, pNamespace, pParam))
               this.#cpNamespace.Release ();

         this.#cpNamespace.Enum_End (pEnum);
      }

      return pNamespace;
   }

   Namespace_Release ()
   {
      this.#cpNamespace.Release ();
   }

   Service_Open (sNamespace, sID_Service, sConnect)
   {
      let pService = null;
      let pNamespace;

      if ((pNamespace = this.#cpNamespace.Get (sNamespace)) != null)
      {
         pService = pNamespace.Service_Open (sID_Service, sConnect);

         this.#cpNamespace.Release ();
      }

      return pService;
   }

   Service_Close (sNamespace, pService)
   {
      let pNamespace;

      if ((pNamespace = this.#cpNamespace.Get (sNamespace)) != null)
      {
         pService = pNamespace.Service_Close (pService);

         this.#cpNamespace.Release ();
      }

      return pService;
   }

   Service_Length (sNamespace, sID_Service)
   {
      let nLength = -1;
      let pNamespace;

      if ((pNamespace = this.#cpNamespace.Get (sNamespace)) != null)
      {
         nLength = pNamespace.Service_Length (sID_Service);

         this.#cpNamespace.Release ();
      }

      return nLength;
   }

   Service_Index (sNamespace, sID_Service, nIndex)
   {
      let pService = null;
      let pNamespace;

      if ((pNamespace = this.#cpNamespace.Get (sNamespace)) != null)
      {
         pService = pNamespace.Service_Index (sID_Service, nIndex);

         this.#cpNamespace.Release ();
      }

      return pService;
   }

   Service_Enum (sNamespace, sID_Service, pThis, fnCallback, pParam)
   {
      let pService = null;
      let pNamespace;

      if ((pNamespace = this.#cpNamespace.Get (sNamespace)) != null)
      {
         pService = pNamespace.Service_Enum (sID_Service, pThis, fnCallback, pParam);

         this.#cpNamespace.Release ();
      }

      return pService;
   }

   Service_Release (sNamespace, sID_Service)
   {
      let pNamespace;

      if ((pNamespace = this.#cpNamespace.Get (sNamespace)) != null)
      {
         pService = pNamespace.Service_Release (sID_Service);

         this.#cpNamespace.Release ();
      }

      return pService;
   }

   LnG_Open (sNamespace, sID_Service, sConnect, sSession)
   {
      let pLnG = new MV.MVMF.LNG (sNamespace, sID_Service, sConnect, sSession);

      if (pLnG.pSession != null)
      {
         this.#cpLnG.Add (pLnG, pLnG);
      }
      else pLnG = pLnG.destructor ();

      return pLnG;
   }

   LnG_Close (pLnG)
   {
      if (this.#cpLnG.Remove (pLnG) == pLnG)
      {
         pLnG = pLnG.destructor ();
      }

      return null;
   }

   Zone (sZone)
   {
      return this.#pRegistry.Zone (sZone);
   }
}

MV.MVMF.CORE.REQUIRE = class
{
   constructor (sSrc_List, sID_Service, sNamespace)
   {
      let pPlugin, i, asSrc = sSrc_List.split (',');

      this.apPlugin = [];

      for (i=0; i<asSrc.length; i++)
      {
         let asSrc2 = asSrc[i].split ('/');

         if (pPlugin = MV.MVMF.Core.Plugin_Open (asSrc2[0]))
         {
            this.apPlugin[i] = pPlugin;

            if (sID_Service)
            {
               if (pPlugin.InstallPackages (sID_Service, sNamespace, (asSrc2.length == 2 ? asSrc2[1] : undefined)))
               {
               }
            }
         }
         else
         {
            console.log ('Plugin_Open (Failed): ' + asSrc[i]);
            break;
         }
      }

      this.bSuccess = (this.apPlugin.length == asSrc.length);
   }

   destructor ()
   {
      let i;

      for (i=this.apPlugin.length; i>0; i--)
         MV.MVMF.Core.Plugin_Close (this.apPlugin[i-1]);

      return null;
   }

   Success ()
   {
      return this.bSuccess;
   }
}

MV.MVMF.CORE.NAMESPACE = class
{
   #sNamespace;
   #cpServiceClass;
   #cpModelClass;

   constructor (sNamespace)
   {
      this.#sNamespace     = sNamespace;

      this.#cpServiceClass = new MV.MVMF.COLLECTION ();
      this.#cpModelClass   = new MV.MVMF.COLLECTION ();
   }

   destructor ()
   {
      this.#cpModelClass   = this.#cpModelClass  .destructor ();
      this.#cpServiceClass = this.#cpServiceClass.destructor ();

      return null;
   }

   get sNamespace () { return this.#sNamespace; }

   ServiceClass_Add (pService_Factory)
   {
      let bResult = false;
      let pServiceClass;

      pServiceClass = this.#cpServiceClass.Get (pService_Factory.sID, true);
      {
         if (pServiceClass == null)
         {
            pServiceClass = new MV.MVMF.CORE.SERVICECLASS (this, pService_Factory);

            if (this.#cpServiceClass.Add (pService_Factory.sID, pServiceClass))
            {
               bResult = true;
            }
            else pServiceClass = pServiceClass.destructor ();
         }
else
{
   bResult = true;
}
      }
      this.#cpServiceClass.Release ();

      return bResult;
   }

   ServiceClass_Remove (sID_Service)
   {
      let bResult = false;
      let pServiceClass;

      if ((pServiceClass = this.#cpServiceClass.Get (sID_Service)) != null)
      {
         if (pServiceClass.SourceClass_Length () == 0)
         {
            if ((pServiceClass = this.#cpServiceClass.Remove (sID_Service)) != null)
            {
               pServiceClass = pServiceClass.destructor ();

               bResult = true;
            }
         }

         this.#cpServiceClass.Release ();
      }

      return bResult;
   }

   ServiceClass_Length ()
   {
      return this.#cpServiceClass.Length ();
   }

   ServiceClass_Exists (sID_Service)
   {
      return this.#cpServiceClass.Exists (sID_Service);
   }

   ServiceClass_Get (sID_Service)
   {
      return this.#cpServiceClass.Get (sID_Service);
   }

   ServiceClass_Index (nIndex)
   {
      return this.#cpServiceClass.Index (nIndex);
   }

   ServiceClass_Enum (pThis, fnCallback, pParam)
   {
      let pServiceClass = null;
      let pEnum, bResult = true;

      if (pEnum = this.#cpServiceClass.Enum_Begin ())
      {
         while (bResult  &&  (pServiceClass = this.#cpServiceClass.Enum_Next (pEnum)) != null)
            if (bResult = fnCallback.call (pThis, pServiceClass, pParam))
               this.#cpServiceClass.Release ();

         this.#cpServiceClass.Enum_End (pEnum);
      }

      return pServiceClass;
   }

   ServiceClass_Release ()
   {
      this.#cpServiceClass.Release ();
   }

   ModelClass_Add (pModel_Factory)
   {
      let bResult = false;
      let pModelClass;

      pModelClass = this.#cpModelClass.Get (pModel_Factory.sID, true);
      {
         if (pModelClass == null)
         {
            pModelClass = new MV.MVMF.CORE.MODELCLASS (this, pModel_Factory);

            if (this.#cpModelClass.Add (pModel_Factory.sID, pModelClass))
            {
               bResult = true;
            }
            else pModelClass = pModelClass.destructor ();
         }
else
{
   bResult = true;
}
      }
      this.#cpModelClass.Release ();

      return bResult;
   }

   ModelClass_Remove (sID_Model)
   {
      let bResult = false;
      let pModelClass;

      if ((pModelClass = this.#cpModelClass.Get (sID_Model)) != null)
      {
         if (pModelClass.SourceClass_Length () == 0)
         {
            if ((pModelClass = this.#cpModelClass.Remove (sID_Model)) != null)
            {
               pModelClass = pModelClass.destructor ();

               bResult = true;
            }
         }

         this.#cpModelClass.Release ();
      }

      return bResult;
   }

   ModelClass_Length ()
   {
      return this.#cpModelClass.Length ();
   }

   ModelClass_Exists (sID_Model)
   {
      return this.#cpModelClass.Exists (sID_Model);
   }

   ModelClass_Get (sID_Model)
   {
      return this.#cpModelClass.Get (sID_Model);
   }

   ModelClass_Index (nIndex)
   {
      return this.#cpModelClass.Index (nIndex);
   }

   ModelClass_Enum (pThis, fnCallback, pParam)
   {
      let pModelClass = null;
      let pEnum, bResult = true;

      if (pEnum = this.#cpModelClass.Enum_Begin ())
      {
         while (bResult  &&  (pModelClass = this.#cpModelClass.Enum_Next (pEnum)) != null)
            if (bResult = fnCallback.call (pThis, pModelClass, pParam))
               this.#cpModelClass.Release ();

         this.#cpModelClass.Enum_End (pEnum);
      }

      return pModelClass;
   }

   ModelClass_Release ()
   {
      this.#cpModelClass.Release ();
   }

   SourceClass_Add (pSource_Factory)
   {
      let bResult = false;
      let pServiceClass;
      let pModelClass;

      if ((pServiceClass = this.#cpServiceClass.Get (pSource_Factory.pReference.sID_Service)) != null)
      {
         if ((pModelClass = this.#cpModelClass.Get (pSource_Factory.pReference.sID_Model)) != null)
         {
            bResult = pServiceClass.SourceClass_Add (pModelClass, pSource_Factory);

            this.#cpModelClass.Release ();
         }

         this.#cpServiceClass.Release ();
      }

      return bResult;
   }

   SourceClass_Remove (sID_Service, sID_Model)
   {
      let bResult = false;
      let pServiceClass;
      let pModelClass;

      if ((pServiceClass = this.#cpServiceClass.Get (sID_Service)) != null)
      {
         if ((pModelClass = this.#cpModelClass.Get (sID_Model)) != null)
         {
            bResult = pServiceClass.SourceClass_Remove (pModelClass);

            this.#cpModelClass.Release ();
         }

         this.#cpServiceClass.Release ();
      }

      return bResult;
   }

   SourceClass_Length (sID_Service)
   {
      let nLength = -1;
      let pServiceClass;

      if ((pServiceClass = this.#cpServiceClass.Get (sID_Service)) != null)
      {
         nLength = pServiceClass.SourceClass_Length ();

         this.#cpServiceClass.Release ();
      }

      return nLength;
   }

   SourceClass_Exists (sID_Service, sID_Model)
   {
      let nIndex = -1;
      let pServiceClass;

      if ((pServiceClass = this.#cpServiceClass.Get (sID_Service)) != null)
      {
         nIndex = pServiceClass.SourceClass_Exists (sID_Model);

         this.#cpServiceClass.Release ();
      }

      return nIndex;
   }

   SourceClass_Get (sID_Service, sID_Model)
   {
      let pSourceClass = null;
      let pServiceClass;

      if ((pServiceClass = this.#cpServiceClass.Get (sID_Service)) != null)
      {
         pSourceClass = pServiceClass.SourceClass_Get (sID_Model);

         this.#cpServiceClass.Release ();
      }

      return pSourceClass;
   }

   SourceClass_Index (sID_Service, nIndex)
   {
      let pSourceClass = null;
      let pServiceClass;

      if ((pServiceClass = this.#cpServiceClass.Get (sID_Service)) != null)
      {
         pSourceClass = pServiceClass.SourceClass_Index (nIndex);

         this.#cpServiceClass.Release ();
      }

      return pSourceClass;
   }

   SourceClass_Enum (sID_Service, pThis, fnCallback, pParam)
   {
      let pSourceClass = null;
      let pServiceClass;

      if ((pServiceClass = this.#cpServiceClass.Get (sID_Service)) != null)
      {
         pSourceClass = pServiceClass.SourceClass_Enum (pThis, fnCallback, pParam);

         this.#cpServiceClass.Release ();
      }

      return pSourceClass;
   }

   SourceClass_Release (sID_Service)
   {
      let pServiceClass;

      if ((pServiceClass = this.#cpServiceClass.Get (sID_Service)) != null)
      {
         pServiceClass.SourceClass_Release ();

         this.#cpServiceClass.Release ();
      }
   }

   Service_Open (sID_Service, sConnect)
   {
      let pService = null;
      let pServiceClass, pReference;

      if ((pServiceClass = this.#cpServiceClass.Get (sID_Service)) != null)
      {
         if ((pReference = pServiceClass.pService_Factory.Reference (sConnect)) != null)
         {
            pService = pServiceClass.Service_Open (pReference, pServiceClass.pNamespace);
         }

         this.#cpServiceClass.Release ();
      }

      return pService;
   }

   Service_Close (pService)
   {
      let pServiceClass;

      if ((pServiceClass = this.#cpServiceClass.Get (pService.sID)) != null)
      {
         pService = pServiceClass.Service_Close (pService);

         this.#cpServiceClass.Release ();
      }

      return pService;
   }

   Service_Length (sID_Service)
   {
      let nLength = -1;
      let pServiceClass;

      if ((pServiceClass = this.#cpServiceClass.Get (sID_Service)) != null)
      {
         nLength = pServiceClass.Service_Length ();

         this.#cpServiceClass.Release ();
      }

      return nLength;
   }

   Service_Index (sID_Service, nIndex)
   {
      let pService = null;
      let pServiceClass;

      if ((pServiceClass = this.#cpServiceClass.Get (sID_Service)) != null)
      {
         pService = pServiceClass.Service_Index (nIndex);

         this.#cpServiceClass.Release ();
      }

      return pService;
   }

   Service_Enum (sID_Service, pThis, fnCallback, pParam)
   {
      let pService = null;
      let pServiceClass;

      if ((pServiceClass = this.#cpServiceClass.Get (sID_Service)) != null)
      {
         pService = pServiceClass.Service_Enum (pThis, fnCallback, pParam);

         this.#cpServiceClass.Release ();
      }

      return pService;
   }

   Service_Release (sID_Service)
   {
      let pServiceClass;

      if ((pServiceClass = this.#cpServiceClass.Get (sID_Service)) != null)
      {
         pServiceClass.Service_Release ();

         this.#cpServiceClass.Release ();
      }
   }
}

MV.MVMF.CORE.SERVICECLASS = class
{
   #pNamespace;
   #pService_Factory;
   #sopService;
   #cpSourceClass;

   constructor (pNamespace, pService_Factory)
   {
      this.#pNamespace       = pNamespace;
      this.#pService_Factory = pService_Factory;

      this.#sopService    = new MV.MVMF.SHAREDOBJECT ();
      this.#cpSourceClass = new MV.MVMF.COLLECTION ();
   }

   destructor ()
   {
      this.#cpSourceClass = this.#cpSourceClass.destructor ();
      this.#sopService    = this.#sopService   .destructor ();

      return null;
   }

   get pNamespace       () { return this.#pNamespace;       }
   get pService_Factory () { return this.#pService_Factory; }

   SourceClass_Add (pModelClass, pSource_Factory)
   {
      let bResult = false;
      let pSourceClass;

      pSourceClass = this.#cpSourceClass.Get (pModelClass.pModel_Factory.sID, true);
      {
         if (pSourceClass == null)
         {
            pSourceClass = new MV.MVMF.CORE.SOURCECLASS (this.#pNamespace, pModelClass.pModel_Factory, pSource_Factory);

            if (this.#cpSourceClass.Add (pModelClass.pModel_Factory.sID, pSourceClass))
            {
               pModelClass.SourceClass_Add ();

               bResult = true;
            }
            else pSourceClass = pSourceClass.destructor ();
         }
else
{
   bResult = true;
}
      }
      this.#cpSourceClass.Release ();

      return bResult;
   }

   SourceClass_Remove (pModelClass)
   {
      let bResult = false;
      let pSourceClass;

      if ((pSourceClass = this.#cpSourceClass.Remove (pModelClass.pModel_Factory.sID)) != null)
      {
         pModelClass.SourceClass_Remove ();

         pSourceClass = pSourceClass.destructor ();

         bResult = true;
      }

      return bResult;
   }

   SourceClass_Length ()
   {
      return this.#cpSourceClass.Length ();
   }

   SourceClass_Exists (sID_Model)
   {
      return this.#cpSourceClass.Exists (sID_Model);
   }

   SourceClass_Get (sID_Model)
   {
      return this.#cpSourceClass.Get (sID_Model);
   }

   SourceClass_Index (nIndex)
   {
      return this.#cpSourceClass.Index (nIndex);
   }

   SourceClass_Enum (pThis, fnCallback, pParam)
   {
      let pSourceClass = null;
      let pEnum, bResult = true;

      if (pEnum = this.#cpSourceClass.Enum_Begin ())
      {
         while (bResult  &&  (pSourceClass = this.#cpSourceClass.Enum_Next (pEnum)) != null)
            if (bResult = fnCallback.call (pThis, pSourceClass, pParam))
               this.#cpSourceClass.Release ();

         this.#cpSourceClass.Enum_End (pEnum);
      }

      return pSourceClass;
   }

   SourceClass_Release ()
   {
      this.#cpSourceClass.Release ();
   }

   Service_Open (pReference, pNamespace)
   {
      return this.#sopService.Open (pReference, pNamespace);
   }

   Service_Close (pService)
   {
      if (this.#sopService.Close (pService.sKey) !== null)
         pService = null;

      return pService;
   }

   Service_Length ()
   {
      return this.#sopService.Length ();
   }

   Service_Index (nIndex)
   {
      return this.#sopService.Index (nIndex);
   }

   Service_Enum (pThis, fnCallback, pParam)
   {
      return this.#sopService.Enum (pThis, fnCallback, pParam);
   }

   Service_Release ()
   {
      this.#sopService.Release ();
   }
}

MV.MVMF.CORE.MODELCLASS = class
{
   #pNamespace;
   #pModel_Factory;
   #nCount_Source;

   constructor (pNamespace, pModel_Factory)
   {
      this.#pNamespace     = pNamespace;
      this.#pModel_Factory = pModel_Factory;

      this.#nCount_Source = 0;
   }

   destructor ()
   {
      return null;
   }

   get pNamespace     () { return this.#pNamespace;     }
   get pModel_Factory () { return this.#pModel_Factory; }

   SourceClass_Add ()
   {
      this.#nCount_Source++;
   }

   SourceClass_Remove ()
   {
      this.#nCount_Source--;
   }

   SourceClass_Length ()
   {
      return this.#nCount_Source;
   }
}

MV.MVMF.CORE.SOURCECLASS = class
{
   #pNamespace;
   #pModel_Factory;
   #pSource_Factory;

   constructor (pNamespace, pModel_Factory, pSource_Factory)
   {
      this.#pNamespace      = pNamespace;
      this.#pModel_Factory  = pModel_Factory;
      this.#pSource_Factory = pSource_Factory;
   }

   destructor ()
   {
      return null;
   }

   get pModel_Factory  () { return this.#pModel_Factory;  }
   get pSource_Factory () { return this.#pSource_Factory; }
}

MV.MVMF.Class.BASE = class
{

   destructor ()
   {
      return null;
   }
}

MV.MVMF.NOTIFICATION = class
{
   #nReadyState = 0;

   #cpListener;

   constructor ()
   {
      this.#cpListener = new MV.MVMF.COLLECTION (null, new MV.MVMF.NOTIFICATION.ICOMPARE ());
   }

   destructor ()
   {
      let nLength = this.#cpListener.Length ();
      if (nLength > 0)
      {
         console.log ('destructor: Failed to detach ' + nLength + ' listeners from notification object instance: ', this);
         debugger;
      }

      this.#cpListener = this.#cpListener.destructor ();

      return null;
   }

   #Send (pListener, pNotice)
   {
      let fnNotice;

      pNotice.pEmitter = this;

      pNotice.bPropagate = pListener.bPropagate;

      if ((fnNotice = pListener.pThis[pNotice.sNotification]) != undefined
      ||  (fnNotice = pListener.pThis['onElse'             ]) != undefined)
         fnNotice.call (pListener.pThis, pNotice);

      if (pNotice.bPropagate)
         pListener.pThis.#Enum.call (pListener.pThis, pNotice);
   }

   #Enum (pNotice)
   {
      let pListener, pEnum;

      if (pEnum = this.#cpListener.Enum_Begin ())
      {
         while ((pListener = this.#cpListener.Enum_Next (pEnum)) != null)
         {
            this.#Send (pListener, pNotice);

            this.#cpListener.Release ();
         }

         this.#cpListener.Enum_End (pEnum);
      }
   }

   #Init (pThis)
   {
      let pListener;

      if (this.#cpListener != null)
      {
         if ((pListener = this.#cpListener.Get (pThis)) != null)
         {
            let pNotice = new MV.MVMF.NOTIFICATION.NOTICE (this, 'onReadyState', this.#nReadyState);

            this.#Send (pListener, pNotice);

            pNotice.destructor ();

            this.#cpListener.Release ();
         }
      }
   }

   ReadyState (nReadyState)
   {
      if (nReadyState !== undefined)
      {
         if (this.#nReadyState != nReadyState)
         {
            this.#nReadyState = nReadyState;

            let pNotice = new MV.MVMF.NOTIFICATION.NOTICE (this, 'onReadyState', this.#nReadyState);

            this.#Enum (pNotice);

            pNotice.destructor ();
         }
      }

      return this.#nReadyState;
   }

   Emit (sNotification, pData)
   {
      let pNotice = new MV.MVMF.NOTIFICATION.NOTICE (this, sNotification, pData);

      this.#Enum (pNotice);

      pNotice.destructor ();
   };

   Attach (pThis, bPropagate)
   {

      let nResult = -1;
      let pListener;

      if (!bPropagate  ||  pThis instanceof MV.MVMF.NOTIFICATION)
      {
         pListener = this.#cpListener.Get (pThis, true);
         {
            if (pListener == null)
            {
               pListener = new MV.MVMF.NOTIFICATION.LISTENER (this, pThis, bPropagate);

               if (this.#cpListener.Add (pThis, pListener))
               {
                  setTimeout (this.#Init.bind (this, pThis), 0);

                  nResult = this.#cpListener.Length ();
               }
               else pListener.destructor ();
            }
            else
            {
               console.log ('Attach: Already attached to notification object instance: ', this);
               debugger;
            }
         }
         this.#cpListener.Release ();
      }
      else
      {
         console.log ('Attach: Propagating classes must extend MV.MVMF.NOTIFICATION: ', pThis);
         debugger;
      }

      return nResult;
   }

   Detach (pThis)
   {
      let nResult = -1;
      let pListener;

      if ((pListener = this.#cpListener.Remove (pThis)) != null)
      {
         pListener.destructor ();

         nResult = this.#cpListener.Length ();
      }
      else
      {
         console.log ('Detach: Not attached to notification object instance: ', this);
         debugger;
      }

      return nResult;
   }

   IsReady ()
   {
      return false;
   }
}

MV.MVMF.NOTIFICATION.ICOMPARE = class extends MV.MVMF.COLLECTION.ICOMPARE
{

   Compare (pThis, pListener_B) { return (pThis == pListener_B.pThis); }
}

MV.MVMF.NOTIFICATION.LISTENER = class
{
   constructor (pNotification, pThis, bPropagate)
   {
      this.pThis      = pThis;
      this.bPropagate = bPropagate ? true : false;
   }

   destructor ()
   {
      return null;
   }
}

MV.MVMF.NOTIFICATION.NOTICE = class
{
   constructor (pThis, sNotification, pData)
   {
      this.pCreator      = pThis;
      this.sNotification = sNotification;
      this.pData         = pData;

      this.pEmitter      = null;
      this.bPropagate    = true;
   }

   destructor ()
   {
      return null;
   }

   Stop ()
   {
      this.bPropagate = false;
   }
}

MV.MVMF.FACTORY = class
{
}

MV.MVMF.SERVICE = class extends MV.MVMF.NOTIFICATION
{
   #pNamespace;
   #sID;
   #sKey;
   #sopClient;

   constructor (pReference, pNamespace)
   {
      super ();

      this.#pNamespace = pNamespace;
      this.#sID        = pReference.UniqueId ();
      this.#sKey       = pReference.Key      ();

      this.#sopClient = new MV.MVMF.SHAREDOBJECT ();
   }

   destructor ()
   {
      this.#sopClient.destructor ();

      return null;
   }

   get pNamespace () { return this.#pNamespace;            }
   get sNamespace () { return this.#pNamespace.sNamespace; }
   get sID        () { return this.#sID;                   }
   get sKey       () { return this.#sKey;                  }

   Client_Open (pReference_Client)
   {
      return this.#sopClient.Open (pReference_Client, this);
   }

   Client_Close (pClient)
   {
      if (this.#sopClient.Close (pClient.sKey) !== null)
         pClient = null;

      return pClient;
   }

   Client_Length ()
   {
      return this.#sopClient.Length ();
   }

   Client_Exists (twClientIx)
   {
      return this.#sopClient.Exists (twClientIx);
   }

   Client_Get (twClientIx)
   {
      return this.#sopClient.Get (twClientIx);
   }

   Client_Index (nIndex)
   {
      return this.#sopClient.Index (nIndex);
   }

   Client_Enum (pThis, fnCallback, pParam)
   {
      return this.#sopClient.Enum (pThis, fnCallback, pParam);
   }

   Client_Release ()
   {
      return this.#sopClient.Release ();
   }
}

MV.MVMF.SERVICE.FACTORY = class extends MV.MVMF.FACTORY
{
   #sID;

   constructor (sID)
   {
      super ();

      this.#sID = sID;
   }

   destructor ()
   {
      return null;
   }

   get sID () { return this.#sID; }

}

MV.MVMF.SERVICE.IREFERENCE = class extends MV.MVMF.SHAREDOBJECT.IREFERENCE
{
   constructor (sID, sConnect)
   {
      super (sID);

      this.pConnect = MV.MVMF.Decode (sConnect);

      if (this.pConnect.secure)
      {
         this.bSecure = this.pConnect.secure == 'true' ? true : false;
      }

      if (this.pConnect.server)
      {
         let i = this.pConnect.server.indexOf (':');

         if (i < 0)
            this.sHost = this.pConnect.server;
         else
         {
            this.sHost = this.pConnect.server.slice (0, i);

            if (i + 1 < this.pConnect.server.length)
               this.wPort = Number (this.pConnect.server.slice (i + 1));
         }

         if (this.pConnect.port)
         {
            this.wPort = Number (this.pConnect.port);
         }
      }
   }
}

MV.MVMF.CLIENT = class extends MV.MVMF.NOTIFICATION
{
   #sID;
   #sKey;
   #pService;
   #twClientIx;
   #pMem;

   #sopModel;
   #apSource;

   constructor (pReference, pService)
   {
      super ();

      this.#pMem       = new MV.MVMF.MEM (this);
      this.#sID        = pReference.UniqueId ();
      this.#sKey       = pReference.Key      ();
      this.#pService   = pService;
      this.#twClientIx = pReference.twClientIx;

      this.#sopModel   = new MV.MVMF.SHAREDOBJECT ();
      this.#apSource   = [];
   }

   destructor ()
   {
      this.#apSource   = null;
      this.#sopModel   = this.#sopModel.destructor ();
      this.#pMem       = this.pMem.destructor ();

      return null;
   }

   get pNamespace () { return this.#pService.pNamespace; }
   get sNamespace () { return this.#pService.sNamespace; }
   get sID        () { return this.#sID;                 }
   get sKey       () { return this.#sKey;                }
   get pService   () { return this.#pService;            }
   get twClientIx () { return this.#twClientIx;          }
   get pMem       () { return this.#pMem;                }

   Source (wClass)
   {

      return this.#apSource[wClass];
   }

   Model_Open_Aux (sID_Model, sArgs)
   {
      let pModel = null;
      let pSourceClass, pReference, pSource;

      if (pSourceClass = this.pNamespace.SourceClass_Get (this.pService.sID, sID_Model))
      {
         let asArgs = sArgs ? ('' + sArgs).split (',') : [];

         if (pReference = pSourceClass.pModel_Factory.Reference (asArgs))
         {

            if (pSource = pSourceClass.pSource_Factory.Create (this))
            {
               if (pModel = this.#sopModel.Open (pReference, pSource))
               {

                  if (pSource == this.#sopModel.Param (pModel.sKey))
                  {

                     if (this.#apSource[pSourceClass.pSource_Factory.pReference.wClass] != undefined)
                     {

                        this.#sopModel.Close (pModel.sKey);

                        pSource = pSource.destructor ();

                        pModel = null;
                     }
                     else this.#apSource[pSourceClass.pSource_Factory.pReference.wClass] = pSource;
                  }
                  else
                  {

                     pSource = pSource.destructor ();
                  }
               }
               else
               {

                  pSource = pSource.destructor ();
               }
            }
         }

         this.pNamespace.SourceClass_Release (this.pService.sID);
      }

      return pModel;
   }

   Model_Close_Aux (pModel)
   {
      let pSource;

      if (pModel  &&  pModel.pSource)
      {
         if ((pSource = this.#sopModel.Close (pModel.sKey)) !== null)
         {

            if (pSource != undefined)
            {

               delete this.#apSource[pSource.wClass];

               pSource = pSource.destructor ();
            }

            pModel = null;
         }
         else
         {

         }
      }

      return pModel;
   }

   Session_Open (bAutoConnect)
   {
      return this.Model_Open_Aux ('Session_' + this.pService.pNetSettings.sSession, bAutoConnect ? 'true' : 'false');
   }

   Session_Close (pSession)
   {
      return this.Model_Close_Aux (pSession);
   }

   Model_Open (sID_Model, sArgs)
   {
      return this.pMem.Model_Open (sID_Model, sArgs);
   }

   Model_Close (pModel)
   {
      return this.pMem.Model_Close (pModel);
   }
}

MV.MVMF.CLIENT.IREFERENCE = class extends MV.MVMF.SHAREDOBJECT.IREFERENCE
{
   constructor (sID, twClientIx)
   {
      super (sID);

      this.twClientIx  = twClientIx;
   }

   Key ()
   {
      return this.twClientIx + '';
   }
}

MV.MVMF.CLIENT.ACTION = class
{
}

MV.MVMF.CLIENT.IACTION = class
{
   #pClient;
   #pAction;

   constructor (pClient, pAction)
   {
      this.#pClient   = pClient;
      this.#pAction   = pAction;
   }

   Send (pThis, fnResponse, pParam) {}
}

MV.MVMF.CLIENT.IACTION.IRESPONSE = class
{
   onResponse (pIAction, pParam)
   {
   }
}

MV.MVMF.SOURCE = class
{
   #sID_Service;
   #sID_Model;
   #wClass;
   #apAction;
   #pClient;
   #pModel;

   constructor (pReference, pClient)
   {
      this.#sID_Service = pReference.sID_Service;
      this.#sID_Model   = pReference.sID_Model;
      this.#wClass      = pReference.wClass;
      this.#apAction    = pReference.apAction;
      this.#pClient     = pClient;
   }

   initialize (pModel)
   {
      this.#pModel = pModel;
   }

   destructor ()
   {
      return null;
   }

   get pNamespace  () { return this.#pClient.pNamespace; }
   get sNamespace  () { return this.#pClient.sNamespace; }
   get sID_Service () { return this.#sID_Service;        }
   get sID_Model   () { return this.#sID_Model;          }
   get wClass      () { return this.#wClass;             }
   get pClient     () { return this.#pClient;            }
   get pModel      () { return this.#pModel;             }

   Actions ()
   {
      let asAction = [];

      for (let sAction in this.#apAction)
         asAction.push (sAction);

      return asAction;
   }

   Request (sAction)
   {
      let pIAction;

      if (this.#apAction[sAction])
      {
         pIAction = this.#pClient.Request (this.#apAction[sAction]);
      }
      else pIAction = null;

      return pIAction;
   }

   Attach ()
   {
      return true;
   }

   Detach ()
   {
      return true;
   }

   IsDisconnected ()
   {
      return this.#pClient.IsDisconnected ();
   }

   IsConnected ()
   {
      return this.#pClient.IsConnected ();
   }

   IsLoggedOut ()
   {
      return this.#pClient.IsLoggedOut ();
   }

   IsLoggedIn ()
   {
      return this.#pClient.IsLoggedIn ();
   }
}

MV.MVMF.SOURCE.REFERENCE = class
{
   constructor (sID_Service, sID_Model, wClass, apAction)
   {
      this.sID_Service = sID_Service;
      this.sID_Model   = sID_Model;
      this.wClass      = wClass;
      this.apAction    = apAction;
   }
}

MV.MVMF.SOURCE.FACTORY = class extends MV.MVMF.FACTORY
{
   static eTYPE =
   {
      SESSION                : 0,
      OBJECT                 : 1,
      OTHER                  : 2,
   };

   eTYPE = MV.MVMF.SOURCE.FACTORY.eTYPE;

   #pReference;

   constructor (sID_Service, sID_Model, wClass, apAction)
   {
      super ();

      this.#pReference = new MV.MVMF.SOURCE.REFERENCE (sID_Service, sID_Model, wClass, apAction);
   }

   destructor ()
   {
      return null;
   }

   get bType      () { return this.eTYPE.OBJECT; }
   get pReference () { return this.#pReference;  }
}

MV.MVMF.MODEL = class extends MV.MVMF.NOTIFICATION
{
   #sID;
   #sKey;
   #pSource;

   constructor (pReference, pSource)
   {
      super ();

      this.#sID     = pReference.UniqueId ();
      this.#sKey    = pReference.Key      ();
      this.#pSource = pSource;

      pSource.initialize (this);
   }

   get pNamespace () { return this.#pSource.pNamespace; }
   get sNamespace () { return this.#pSource.sNamespace; }
   get sID        () { return this.#sID;                }
   get sKey       () { return this.#sKey;               }
   get pSource    () { return this.#pSource;            }

   Actions ()
   {
      return this.#pSource.Actions ();
   }

   Request (sAction)
   {
      return this.#pSource.Request (sAction);
   }

   Send (sAction, pData, pThis, fnResponse, pParam)
   {
      let bResult  = false;
      let pIAction = this.Request (sAction);
      let pRequest = pIAction.pRequest;

      if (pIAction)
      {
         for (var sParam in pData)
            pRequest[sParam] = pData[sParam];

         if (!fnResponse)
            fnResponse = function (pIAction, pParam)
            {
               if (pIAction.pResponse && pIAction.pResponse.nResult != 0)
                  console.log ('ERROR: ', pIAction);
            };

         bResult = pIAction.Send (pThis, fnResponse, pParam);
      }

      return bResult;
   }

   Attach (pThis, bPropagate)
   {
      let nLength = super.Attach (pThis, bPropagate);

      if (nLength == 1)
         this.pSource.Attach ();

      return nLength;
   }

   Detach (pThis)
   {
      let nLength = super.Detach (pThis);

      if (nLength == 0)
         this.pSource.Detach ();

      return nLength;
   }
}

MV.MVMF.MODEL.FACTORY = class extends MV.MVMF.FACTORY
{
   #sID;

   constructor (sID)
   {
      super ();

      this.#sID = sID;
   }

   destructor ()
   {
      return null;
   }

   get sID () { return this.#sID; }
}

MV.MVMF.MODEL.IREFERENCE = class extends MV.MVMF.SHAREDOBJECT.IREFERENCE
{

}

MV.MVMF.MEM = class
{
   static eOBJECTHEAD =
   {
      FLAG:
      {
         OBJECT_EXPIRED    : 0x01,
         RESERVED          : 0x06,
         CLIENT_RECOVERED  : 0x08,

         SUBSCRIBE_MASK    : 0x30,
         SUBSCRIBE_PARTIAL : 0x10,
         SUBSCRIBE_FULL    : 0x20,

         EXPIRED_MASK      : 0xC0,
         EXPIRED_PARTIAL   : 0x40,
         EXPIRED_FULL      : 0x80,
      },
   };

   static eOBJECT_CHANGE =
   {
      FLAG:
      {
         OPEN              : 0x01,
         CLOSE             : 0x02,
         RESET             : 0x04,
         ADDENDUM          : 0x08,
         PARTIAL           : 0x10,
      },
   };

   eOBJECTHEAD    = MV.MVMF.MEM.eOBJECTHEAD;
   eOBJECT_CHANGE = MV.MVMF.MEM.eOBJECT_CHANGE;

   #aObjectBank = [];

   #pParent_X;

   #pClient;

   constructor (pClient)
   {
      this.#pClient = pClient;

      this.#pParent_X =
      {
         pObjectHead : new MV.MVMF.MEM.SOURCE.OBJECTHEAD (),
         Inserted    : function (pChild, pChange) {},
         Deleting    : function (pChild, pChange) {},
         Updating    : function (pChild         ) {},
         Updated     : function (pChild         ) {},
         Changing    : function (pChild, pChange) {},
         Changed     : function (pChild, pChange) {}
      }
   }

   destructor ()
   {
      this.Object_Delete_All ();

      for (let wClass in this.#aObjectBank)
      {
         this.#aObjectBank[wClass].destructor ();

         delete this.#aObjectBank[wClass];
      }

      return null;
   }

   get pNamespace () { return this.#pClient.pNamespace; }
   get sNamespace () { return this.#pClient.sNamespace; }
   get pClient    () { return this.#pClient;            }

   ObjectBank (wClass)
   {
      if (this.#aObjectBank[wClass] == undefined)
      {
         let Callback = function (pSourceClass, wClass)
         {
            return !(pSourceClass.pSource_Factory.bType == pSourceClass.pSource_Factory.eTYPE.OBJECT  &&  pSourceClass.pSource_Factory.pReference.wClass == wClass);
         }

         let pSourceClass;

         if ((pSourceClass = this.pNamespace.SourceClass_Enum (this.#pClient.pService.sID, this, Callback, wClass)) != null)
         {
            if (pSourceClass.pSource_Factory.pReference.bIndependent)
                  this.#aObjectBank[wClass] = new MV.MVMF.MEM.OBJECTBANK_IND (this, pSourceClass.pModel_Factory, pSourceClass.pSource_Factory);
            else this.#aObjectBank[wClass] = new MV.MVMF.MEM.OBJECTBANK_DEP (this, pSourceClass.pModel_Factory, pSourceClass.pSource_Factory);

            this.pNamespace.SourceClass_Release (this.#pClient.pService.sID);
         }
      }

      return this.#aObjectBank[wClass];
   }

   Model_Open (sID_Model, sArgs)
   {
      let pModel = null;
      let pSourceClass, pObjectBank;

      if (pSourceClass = this.pNamespace.SourceClass_Get (this.#pClient.pService.sID, sID_Model))
      {
         if ((pObjectBank = this.ObjectBank (pSourceClass.pSource_Factory.pReference.wClass)) != undefined)
         {
            pModel = pObjectBank.Model_Open (sArgs, 0, 0);
         }

         this.pNamespace.SourceClass_Release (this.#pClient.pService.sID);
      }

      return pModel;
   }

   Model_Close (pModel)
   {
      let pSourceClass, pObjectBank;

      if (pModel  &&  pModel.pSource)
      {
         if ((pObjectBank = this.ObjectBank (pModel.pSource.wClass)) != undefined)
         {
            pModel = pObjectBank.Model_Close (pModel);
         }
      }

      return pModel;
   }

   Model_Length ()
   {

   }

   Model_Enum (pThis, fnCallback, pParam)
   {

   }

   Parent_Get (pObjectBank_Parent, wClass_Parent, twParentIx)
   {
      let pParent;

      if (pObjectBank_Parent == null  ||  (pParent = pObjectBank_Parent.Get (null, twParentIx)) == null)
      {
         pParent                           = this.#pParent_X;

         pParent.pObjectHead.wClass_Object = wClass_Parent;
         pParent.pObjectHead.twObjectIx    = twParentIx;
      }

      return pParent;
   }

   Object_Update (pObjectHead, pThis, fnCallback, pParam)
   {
      let bResult = false;
      let pObjectBank_Parent, pParent;
      let pObjectBank_Object, pObject;
      let bInsert, bOpen, bChange, bDiscard, wFlags;

      pObjectHead.wFlags &= this.eOBJECTHEAD.FLAG.SUBSCRIBE_MASK;

      if (pObjectHead.wFlags == this.eOBJECTHEAD.FLAG.SUBSCRIBE_PARTIAL  ||  pObjectHead.wFlags == this.eOBJECTHEAD.FLAG.SUBSCRIBE_FULL)
      {
         pObjectBank_Parent = this.ObjectBank (pObjectHead.wClass_Parent);

         if ((pParent = this.Parent_Get (pObjectBank_Parent, pObjectHead.wClass_Parent, pObjectHead.twParentIx)) != null)
         {
            if ((pObjectBank_Object = this.ObjectBank (pObjectHead.wClass_Object)) != null)
            {
               if ((pObject = pObjectBank_Object.Get (pParent, pObjectHead.twObjectIx)) == null  ||  (pObject.pObjectHead.wFlags & this.eOBJECTHEAD.FLAG.SUBSCRIBE_MASK) == 0)
               {
                  if (pObject != null)
                  {

                     pObject.pObjectHead.wClass_Parent = pObjectHead.wClass_Parent;
                     pObject.pObjectHead.twParentIx    = pObjectHead.twParentIx;
                  }

                  bInsert  = true;
                  bOpen    = ((pObjectHead.wFlags & this.eOBJECTHEAD.FLAG.SUBSCRIBE_FULL) != 0);
                  bChange  = false;
                  bDiscard = false;

                  if (pObjectBank_Parent)
                     pObjectBank_Parent.Child_Set (pObjectHead.wClass_Object);

                  pObject = pObjectBank_Object.Object_Open (pObjectHead.wClass_Parent, pObjectHead.twParentIx, pObjectHead.wClass_Object, pObjectHead.twObjectIx);
               }
               else
               {
                  bInsert  = false;
                  bOpen    = ((pObjectHead.wFlags & this.eOBJECTHEAD.FLAG.SUBSCRIBE_FULL) != 0  &&  (pObject.pObjectHead.wFlags & this.eOBJECTHEAD.FLAG.SUBSCRIBE_FULL) == 0);
                  bChange  = ((pObjectHead.wFlags & this.eOBJECTHEAD.FLAG.SUBSCRIBE_FULL) != 0  ||  (pObject.pObjectHead.wFlags & this.eOBJECTHEAD.FLAG.SUBSCRIBE_FULL) == 0);
                  bDiscard = (bChange == false);
               }

               if (pObject != null)
               {
                  if (bChange != false)
                  {
                     pParent.Updating (pObject);
                     pObject.Updating (null);
                  }

                  wFlags = pObject.pObjectHead.wFlags;

                  pObject.pObjectHead.wFlags |=   pObjectHead.wFlags;
                  pObject.pObjectHead.wFlags &= ~(pObjectHead.wFlags << 2);

                  bResult = fnCallback.call (pThis, pObject, bDiscard, pParam);

                  if (bDiscard == false)
                     pObject.pObjectHead.wFlags &= ~this.eOBJECTHEAD.FLAG.CLIENT_RECOVERED;

                  if (bOpen != false)
                  {

                  }

                  if (bInsert != false)
                  {
                     pObject.Inserted (null,    null);
                     pParent.Inserted (pObject, null);
                  }
                  else if (bChange == false)
                  {

                     pParent.Inserted (pObject, null);
                  }

                  if (bChange != false)
                  {
                     pObject.Updated (null);
                     pParent.Updated (pObject);
                  }

                  if (((wFlags ^ pObject.pObjectHead.wFlags) & this.eOBJECTHEAD.FLAG.SUBSCRIBE_FULL) != 0)
                     pObject.Full ();
                  else if (((wFlags ^ pObject.pObjectHead.wFlags) & this.eOBJECTHEAD.FLAG.SUBSCRIBE_PARTIAL) != 0  &&  (wFlags & this.eOBJECTHEAD.FLAG.SUBSCRIBE_FULL) == 0)
                     pObject.Partial ();
               }
            }
         }
      }

      return bResult;
   }

   Object_Change (wClass_Object, twObjectIx, wClass_Child, twChildIx, wFlags, pChange, pThis, fnCallback, pParam)
   {
      let bResult = false;
      let pObjectBank_Parent, pParent;
      let pObjectBank_Object, pObject;
      let pObjectBank_Child,  pChild;

      let bOpen    = ((wFlags & this.eOBJECT_CHANGE.FLAG.OPEN   ) != 0);
      let bClose   = ((wFlags & this.eOBJECT_CHANGE.FLAG.CLOSE  ) != 0);

      let bPartial = ((wFlags & this.eOBJECT_CHANGE.FLAG.PARTIAL) != 0);

      let bChange  = (bOpen == false  &&  bClose == false);

      if ((pObjectBank_Object = this.ObjectBank (wClass_Object)) != null)
      {
         if ((pObject = pObjectBank_Object.Get (null, twObjectIx)) != null)
         {
            if (((pObject.pObjectHead.wFlags & this.eOBJECTHEAD.FLAG.SUBSCRIBE_PARTIAL) != 0  &&  (pObject.pObjectHead.wFlags & this.eOBJECTHEAD.FLAG.EXPIRED_PARTIAL) == 0  &&  bPartial != false)
            ||  ((pObject.pObjectHead.wFlags & this.eOBJECTHEAD.FLAG.SUBSCRIBE_FULL)    != 0  &&  (pObject.pObjectHead.wFlags & this.eOBJECTHEAD.FLAG.EXPIRED_FULL)    == 0))
            {
               pObjectBank_Parent = this.ObjectBank (pObject.pObjectHead.wClass_Parent);

               if ((pParent = this.Parent_Get (pObjectBank_Parent, pObject.pObjectHead.wClass_Parent, pObject.pObjectHead.twParentIx)) != null)
               {
                  if (wClass_Child != MV.MVMF.Const.BANK_NULL  &&  bOpen == false)
                  {
                     if ((pObjectBank_Child = this.ObjectBank (wClass_Child)) != null)
                     {
                        pChild = pObjectBank_Child.Get (pObject, twChildIx);
                     }
                     else pChild = null;
                  }
                  else pChild = null;

                  pParent.Changing (pObject, pChange);
                  pObject.Changing (pChild,  pChange);
                  if (bChange != false  &&  pChild != null  &&  bClose == false)
                     pChild.Changing (null,  pChange);

                  if (wClass_Child != MV.MVMF.Const.BANK_NULL  &&  bClose != false  &&  pChild != null)
                  {
                     pObject.Deleting (pChild, pChange);
                     pChild .Deleting (null,   pChange);
                  }

                  if (wClass_Child != MV.MVMF.Const.BANK_NULL  &&  bOpen != false)
                  {
                     if ((pObject.pObjectHead.wFlags & this.eOBJECTHEAD.FLAG.SUBSCRIBE_FULL) != 0)
                     {
                        pObjectBank_Child = this.ObjectBank (wClass_Child);

                        pObjectBank_Object.Child_Set (wClass_Child);

                        if ((pChild = pObjectBank_Child.Get (pObject, twChildIx)) == null)
                        {
                           pChild = pObjectBank_Child.Object_Open (wClass_Object, twObjectIx, wClass_Child, twChildIx);
                        }
                        else bOpen = false;

                        if (pChild != null)
                        {

                           pChild.pObjectHead.wClass_Parent = wClass_Object;
                           pChild.pObjectHead.twParentIx    = twObjectIx;

                           pChild.pObjectHead.wFlags |= this.eOBJECTHEAD.FLAG.SUBSCRIBE_PARTIAL;

                        }
                     }
                  }

                  bResult = fnCallback.call (pThis, pParent, pObject, pChild, pParam);

                  if (wClass_Child != MV.MVMF.Const.BANK_NULL  &&  bClose != false)
                  {
                     if ((pObject.pObjectHead.wFlags & this.eOBJECTHEAD.FLAG.SUBSCRIBE_FULL) != 0)
                     {
                        if (pChild != null)
                        {
                           pChild.pObjectHead.wFlags &= ~this.eOBJECTHEAD.FLAG.SUBSCRIBE_PARTIAL;
                           pChild.pObjectHead.wFlags &= ~this.eOBJECTHEAD.FLAG.EXPIRED_PARTIAL;

                           if ((pChild.pObjectHead.wFlags & this.eOBJECTHEAD.FLAG.SUBSCRIBE_MASK) == 0)
                           {
                              pChild = pObjectBank_Child.Object_Close (pChild);
                           }
                        }
                     }
                  }

                  if (wClass_Child != MV.MVMF.Const.BANK_NULL  &&  bOpen != false  &&  pChild != null)
                  {
                     pChild .Inserted (null,   pChange);
                     pObject.Inserted (pChild, pChange);

                     pChild.Partial ();
                  }

                  if (bChange != false  &&  pChild != null  &&  bClose == false)
                     pChild.Changed (null,  pChange);
                  pObject.Changed (pChild,  pChange);
                  pParent.Changed (pObject, pChange);
               }
            }
         }
      }

      return bResult;
   }

   Object_Close_Partial (pObject, pChild)
   {
      let bResult = false;

      if ((pChild.pObjectHead.wFlags & this.eOBJECTHEAD.FLAG.SUBSCRIBE_PARTIAL) != 0)
      {
         if ((pChild.pObjectHead.wFlags & this.eOBJECTHEAD.FLAG.SUBSCRIBE_FULL) == 0)
         {
            pObject.Deleting (pChild, null);
            pChild .Deleting (null,   null);
         }

         pChild.pObjectHead.wFlags &= ~this.eOBJECTHEAD.FLAG.SUBSCRIBE_PARTIAL;
         pChild.pObjectHead.wFlags &= ~this.eOBJECTHEAD.FLAG.EXPIRED_PARTIAL;

         if ((pChild.pObjectHead.wFlags & this.eOBJECTHEAD.FLAG.SUBSCRIBE_MASK) == 0)
         {
            this.#aObjectBank[pChild.pObjectHead.wClass_Object].Object_Close (pChild);
         }

         bResult = true;
      }

      return bResult;
   }

   Object_Close_Full (pObject)
   {
      let bResult = false;

      if ((pObject.pObjectHead.wFlags & this.eOBJECTHEAD.FLAG.SUBSCRIBE_FULL) != 0)
      {
         let pObjectBank_Parent = this.ObjectBank (pObject.pObjectHead.wClass_Parent);
         let pParent = this.Parent_Get (pObjectBank_Parent, pObject.pObjectHead.wClass_Parent, pObject.pObjectHead.twParentIx);

         if ((pObject.pObjectHead.wFlags & this.eOBJECTHEAD.FLAG.SUBSCRIBE_PARTIAL) == 0)
         {
            pParent.Deleting (pObject, null);
            pObject.Deleting (null,    null);
         }

         pObject.pObjectHead.wFlags &= ~this.eOBJECTHEAD.FLAG.SUBSCRIBE_FULL;
         pObject.pObjectHead.wFlags &= ~this.eOBJECTHEAD.FLAG.EXPIRED_FULL;

         pObject.pObjectHead.wFlags &= ~this.eOBJECTHEAD.FLAG.CLIENT_RECOVERED;

         pObject.Partial ();

         if ((pObject.pObjectHead.wFlags & this.eOBJECTHEAD.FLAG.SUBSCRIBE_MASK) == 0)
         {
            this.#aObjectBank[pObject.pObjectHead.wClass_Object].Object_Close (pObject);
         }

         bResult = true;
      }

      return bResult;
   }

   Object_Expire_Partial (pObject, wClass)
   {
      let bResult = true;

      this.#aObjectBank[wClass].Enum
      (
         pObject,
         this,
         function (pChild)
         {
            if ((pChild.pObjectHead.wFlags & this.eOBJECTHEAD.FLAG.SUBSCRIBE_PARTIAL) != 0)
               pChild.pObjectHead.wFlags |= this.eOBJECTHEAD.FLAG.EXPIRED_PARTIAL;

            return 0;
         }
      );

      return bResult;
   }

   Object_Purge_Partial (pObject, wClass)
   {
      let bResult = true;

      this.#aObjectBank[wClass].Enum
      (
         pObject,
         this,
         function (pChild)
         {
            if ((pChild.pObjectHead.wFlags & this.eOBJECTHEAD.FLAG.EXPIRED_PARTIAL) != 0)
               this.Object_Close_Partial (pObject, pChild);

            return 0;
         }
      );

      return bResult;
   }

   Object_Delete_Partial (pObject, wClass)
   {
      let bResult = true;

      this.#aObjectBank[wClass].Enum
      (
         pObject,
         this,
         function (pChild)
         {
            this.Object_Close_Partial (pObject, pChild);

            return 0;
         }
      );

      return bResult;
   }

   Object_Expire_Full (pObject)
   {
      let bResult = false;

      if (pObject != null)
      {
         if ((pObject.pObjectHead.wFlags & this.eOBJECTHEAD.FLAG.SUBSCRIBE_FULL) != 0)
         {
            bResult = true;

            pObject.Recovering ();

            this.#aObjectBank[pObject.pObjectHead.wClass_Object].Child_Enum
            (
               this,
               function (wClass_Child)
               {
                  bResult &= this.Object_Expire_Partial (pObject, wClass_Child);

                  return true;
               }
            );

            pObject.pObjectHead.wFlags |= this.eOBJECTHEAD.FLAG.EXPIRED_FULL;
         }
      }

      return bResult;
   }

   Object_Purge_Full (pObject)
   {
      let bResult = false;

      if (pObject != null)
      {
         if ((pObject.pObjectHead.wFlags & this.eOBJECTHEAD.FLAG.SUBSCRIBE_FULL) != 0)
         {
            bResult = true;

            pObject.pObjectHead.wFlags |= this.eOBJECTHEAD.FLAG.CLIENT_RECOVERED;

            this.#aObjectBank[pObject.pObjectHead.wClass_Object].Child_Enum
            (
               this,
               function (wClass_Child)
               {
                  bResult &= this.Object_Purge_Partial (pObject, wClass_Child);

                  return true;
               }
            );

            if ((pObject.pObjectHead.wFlags & this.eOBJECTHEAD.FLAG.EXPIRED_FULL) != 0)
               bResult &= this.Object_Close_Full (pObject);

            pObject.Recovered ();
         }
      }

      return bResult;
   }

   Object_Delete_Full (pObject)
   {
      let bResult = false;

      if (pObject != null)
      {
         if ((pObject.pObjectHead.wFlags & this.eOBJECTHEAD.FLAG.SUBSCRIBE_FULL) != 0)
         {
            bResult = true;

            this.#aObjectBank[pObject.pObjectHead.wClass_Object].Child_Enum
            (
               this,
               function (wClass_Child)
               {
                  bResult &= this.Object_Delete_Partial (pObject, wClass_Child);

                  return true;
               }
            );

            bResult &= this.Object_Close_Full (pObject);
         }
      }

      return bResult;
   }

   Object_Expire_All ()
   {
      let bResult = true;

      for (let wClass in this.#aObjectBank)
      {
         if (this.#aObjectBank[wClass].bIndependent != false)
            this.#aObjectBank[wClass].Enum
            (
               null,
               this,
               function (pObject)
               {
                  if ((pObject.pObjectHead.wFlags & this.eOBJECTHEAD.FLAG.SUBSCRIBE_FULL) != 0)
                     bResult &= this.Object_Expire_Full (pObject);

                  return 0;
               }
            );
      }

      return bResult;
   }

   Object_Purge_All ()
   {
      let bResult = true;

      for (let wClass in this.#aObjectBank)
      {
         if (this.#aObjectBank[wClass].bIndependent != false)
            this.#aObjectBank[wClass].Enum
            (
               null,
               this,
               function (pObject)
               {
                  if ((pObject.pObjectHead.wFlags & this.eOBJECTHEAD.FLAG.SUBSCRIBE_FULL) != 0)
                     bResult &= this.Object_Purge_Full (pObject);

                  return 0;
               }
            );
      }

      return bResult;
   }

   Object_Delete_All ()
   {
      let bResult = true;

      for (let wClass in this.#aObjectBank)
      {
         if (this.#aObjectBank[wClass].bIndependent != false)
            this.#aObjectBank[wClass].Enum
            (
               null,
               this,
               function (pObject)
               {
                  if ((pObject.pObjectHead.wFlags & this.eOBJECTHEAD.FLAG.SUBSCRIBE_FULL) != 0)
                     bResult &= this.Object_Delete_Full (pObject);

                  return 0;
               }
            );
      }

      return bResult;
   }
}

MV.MVMF.MEM.OBJECTBANK = class
{
   #pMem;
   #pModel_Factory;
   #pSource_Factory;

   #sopModel;

   #awClass_Child = [];

   constructor (pMem, pModel_Factory, pSource_Factory)
   {
      this.#pMem            = pMem;
      this.#pModel_Factory  = pModel_Factory;
      this.#pSource_Factory = pSource_Factory;

      this.#sopModel = new MV.MVMF.SHAREDOBJECT ();
   }

   destructor ()
   {
      this.#sopModel.destructor ();

      return null;
   }

   get pModel_Factory  () { return this.#pModel_Factory;  }
   get pSource_Factory () { return this.#pSource_Factory; }

   Child_Set (wClass)
   {
      if (wClass >= 0)
      {
         this.#awClass_Child[wClass] = true;
      }
   }

   Child_Enum (pThis, fnCallback, pParam)
   {
      let bResult = true;

      for (let wClass in this.#awClass_Child)
         if ((bResult = fnCallback.call (pThis, wClass, pParam)) == false)
            break;

      return bResult;
   }

   Model_Open (sArgs, wClass_Parent, twParentIx)
   {
      let pModel = null;
      let pSource;
      let pReference;

      let asArgs = sArgs ? ('' + sArgs).split (',') : [];

      if (pReference = this.#pModel_Factory.Reference (asArgs))
      {

         if (pSource = this.#pSource_Factory.Create (this.#pMem.pClient))
         {
            if (pModel = this.#sopModel.Open (pReference, pSource))
            {

               if (pSource == this.#sopModel.Param (pModel.sKey))
               {

                  let pObject = pSource;

                  if (wClass_Parent == 0)
                  {
                     twParentIx = pObject.pObjectHead.twParentIx ? pObject.pObjectHead.twParentIx : MV.MVMF.Const.OBJECTIX_MAX - 1;
                  }

                  pObject.pObjectHead.wClass_Parent = wClass_Parent;
                  pObject.pObjectHead.twParentIx    = twParentIx;
                  pObject.pObjectHead.wClass_Object = this.#pSource_Factory.pReference.wClass;

                  pObject.pObjectHead.wFlags        = 0;

                  if (this.Insert (pObject) == false)
                  {

                     this.#sopModel.Close (pModel.sKey);

                     pSource = pSource.destructor ();

                     pModel = null;
                  }
               }
               else
               {

                  pSource = pSource.destructor ();
               }
            }
            else
            {

               pSource = pSource.destructor ();
            }
         }
      }

      return pModel;
   }

   Model_Close (pModel)
   {
      let pSource;

      if ((pSource = this.#sopModel.Close (pModel.sKey)) !== null)
      {

         if (pSource != undefined)
         {

            let pObject = pSource;

            if (this.Delete (pObject) == false)
            {

            }

            pSource = pSource.destructor ();
         }

         pModel = null;
      }
      else
      {

      }

      return pModel;
   }

   Model_Length ()
   {
      return this.#sopModel.Length ();
   }

   Object_Open (wClass_Parent, twParentIx, wClass_Object, twObjectIx)
   {
      let pSource = null;
      let pModel;

      if (wClass_Object == this.#pSource_Factory.pReference.wClass)
      {
         let sArgs = this.MakeArgs (twParentIx, twObjectIx);

         if ((pModel = this.Model_Open (sArgs, wClass_Parent, twParentIx)) != null)
         {
            pSource = pModel.pSource;
         }
      }

      return pSource;
   }

   Object_Close (pSource)
   {
      if (this.Model_Close (pSource.pModel) == null)
      {
         pSource = null;
      }

      return pSource;
   }

   Count        (pParent) {}

   Get          (pParent, twObjectIx) {}
   Index        (pParent, twIndex) {}
   Next         (pParent, twObjectIx) {}
   Enum         (pParent, pThis, fnCallback, pParam) {}

   Insert       (pObject) {}
   Delete       (pObject) {}
}

MV.MVMF.MEM.OBJECTBANK_IND = class extends MV.MVMF.MEM.OBJECTBANK
{
   #apObject = {};

   constructor (pMem, pModel_Factory, pSource_Factory)
   {
      super (pMem, pModel_Factory, pSource_Factory);
   }

   destructor ()
   {
      let pObject;

      while (pObject = this.Index (null, 0))
      {
         this.Object_Close (pObject);
      }

      return null;
   }

   get bIndependent () { return true; }

   MakeArgs (twParentIx, twObjectIx)
   {
      return '' + twObjectIx;
   }

   Count (pParent)
   {
      let nCount = 0;
      let tw;

      for (tw in this.#apObject)
         nCount++;

      return nCount;
   }

   Get (pParent, twObjectIx)
   {
      let pObject = null;

      if (this.#apObject[twObjectIx] != null)
      {
         pObject = this.#apObject[twObjectIx];
      }

      return pObject;
   }

   Index (pParent, twIndex)
   {
      let pObject = null;
      let tw;

      if (twIndex < 0)
         twIndex = 0;

      for (tw in this.#apObject)
         if (twIndex-- == 0)
         {
            pObject = this.#apObject[tw];
            break;
         }

      return pObject;
   }

   Next (pParent, twObjectIx)
   {
      let pObject = null;
      let tw, twNext;

      if (twObjectIx >= MV.MVMF.Const.OBJECTIX_NULL  &&  twObjectIx < MV.MVMF.Const.OBJECTIX_MAX)
      {
         for (tw in this.#apObject)
         {
            if (tw > twObjectIx  &&  (pParent == null  ||  (pParent.pObjectHead.wClass_Object == this.#apObject[tw].pObjectHead.wClass_Parent  &&  pParent.pObjectHead.twObjectIx == this.#apObject[tw].pObjectHead.twParentIx)))
            {
               twNext = tw;
               break;
            }
         }

         if (twNext)
         {
            pObject = this.#apObject[twNext];
         }
      }

      return pObject;
   }

   Enum (pParent, pThis, fnCallback, pParam)
   {
      let nResult = 0;
      let tw;

      for (tw in this.#apObject)
      {
         let pObject = this.#apObject[tw];

         if (pParent == null  ||  (pParent.pObjectHead.wClass_Object == pObject.pObjectHead.wClass_Parent  &&  pParent.pObjectHead.twObjectIx == pObject.pObjectHead.twParentIx))
         {
            nResult = fnCallback.call (pThis, pObject, pParam);

         }
      }

      return nResult;
   }

   Insert (pObject)
   {
      let bResult = false;

      if (pObject.pObjectHead.twParentIx > MV.MVMF.Const.OBJECTIX_NULL  &&  pObject.pObjectHead.twParentIx < MV.MVMF.Const.OBJECTIX_MAX)
      {
         if (pObject.pObjectHead.twObjectIx > MV.MVMF.Const.OBJECTIX_NULL  &&  pObject.pObjectHead.twObjectIx < MV.MVMF.Const.OBJECTIX_MAX)
         {
            if (this.#apObject[pObject.pObjectHead.twObjectIx] == null)
            {
               this.#apObject[pObject.pObjectHead.twObjectIx] = pObject;

               bResult = true;
            }
         }
      }

      return bResult;
   }

   Delete (pObject)
   {
      let bResult = false;

      if (this.#apObject[pObject.pObjectHead.twObjectIx] != null)
      {
         delete this.#apObject[pObject.pObjectHead.twObjectIx];

         bResult = true;
      }

      return bResult;
   }
}

MV.MVMF.MEM.OBJECTBANK_DEP = class extends MV.MVMF.MEM.OBJECTBANK
{
   #aParent = {};

   constructor (pMem, pModel_Factory, pSource_Factory)
   {
      super (pMem, pModel_Factory, pSource_Factory);
   }

   destructor ()
   {
      for (let twParentIx in this.#aParent)
      {
         this.Parent_Close (twParentIx);
      }

      return null;
   }

   get bIndependent () { return false; }

   MakeArgs (twParentIx, twObjectIx)
   {
      return twParentIx + ',' + twObjectIx;
   }

   Parent_Open (twParentIx)
   {
      if (this.#aParent[twParentIx] == null)
         this.#aParent[twParentIx] = {};

      return this.#aParent[twParentIx];
   }

   Parent_Close (twParentIx)
   {
      let apObject = this.#aParent[twParentIx];
      let pObject;

      do
      {
         pObject = null;
         for (let twObjectIx in apObject)
         {
            pObject = apObject[twObjectIx];
            break;
         }

         if (pObject)
         {
            this.Object_Close (pObject);
         }
      }
      while (pObject);

      return null;
   }

   Count (pParent)
   {
      let apObject = this.Parent_Open (pParent.pObjectHead.twObjectIx);
      let nCount = 0;
      let tw;

      if (apObject)
      {
         for (tw in apObject)
            nCount++;
      }

      return nCount;
   }

   Get (pParent, twObjectIx)
   {
      let apObject = this.Parent_Open (pParent.pObjectHead.twObjectIx);

      let pObject = null;

      if (apObject)
      {
         if (apObject[twObjectIx])
         {
            pObject = apObject[twObjectIx];
         }
      }

      return pObject;
   }

   Index (pParent, twIndex)
   {
      let apObject = this.Parent_Open (pParent.pObjectHead.twObjectIx);

      let pObject = null;

      if (apObject)
      {
         for (let twObjectIx in apObject)
         {
            if (twIndex-- < 0)
               break;

            pObject = apObject[twObjectIx];
         }
      }

      return pObject;
   }

   Next (pParent, twObjectIx_Prev)
   {
      let apObject = this.Parent_Open (pParent.pObjectHead.twObjectIx);

      let pObject = null;

      if (apObject)
      {
         if (twObjectIx_Prev >= MV.MVMF.Const.OBJECTIX_NULL  &&  twObjectIx_Prev < MV.MVMF.Const.OBJECTIX_MAX)
         {
            for (let twObjectIx in apObject)
            {
               if (twObjectIx > twObjectIx_Prev)
               {
                  pObject = apObject[twObjectIx];

                  break;
               }
            }
         }
      }

      return pObject;
   }

   Enum (pParent, pThis, fnCallback, pParam)
   {
      let nResult = -1;
      let apObject = this.Parent_Open (pParent.pObjectHead.twObjectIx);

      if (apObject)
      {
         for (let twObjectIx in apObject)
            if ((nResult = fnCallback.call (pThis, apObject[twObjectIx], pParam)) != 0)
               break;
      }

      return nResult;
   }

   Insert (pObject)
   {
      let apObject = this.Parent_Open (pObject.pObjectHead.twParentIx);

      let bResult = false;

      if (apObject)
      {
         if (pObject.pObjectHead.twParentIx > MV.MVMF.Const.OBJECTIX_NULL  &&  pObject.pObjectHead.twParentIx < MV.MVMF.Const.OBJECTIX_MAX)
         {
            if (pObject.pObjectHead.twObjectIx > MV.MVMF.Const.OBJECTIX_NULL  &&  pObject.pObjectHead.twObjectIx < MV.MVMF.Const.OBJECTIX_MAX)
            {
               if (apObject[pObject.pObjectHead.twObjectIx] == null)
               {
                  apObject[pObject.pObjectHead.twObjectIx] = pObject;

                  bResult = true;
               }
            }
         }
      }

      return bResult;
   }

   Delete (pObject)
   {
      let apObject = this.Parent_Open (pObject.pObjectHead.twParentIx);

      let bResult = false;

      if (apObject)
      {
         let twObjectIx = pObject.pObjectHead.twObjectIx;

         if (apObject[twObjectIx] != null)
         {
            delete apObject[twObjectIx];

            bResult = true;
         }
      }

      return bResult;
   }
}

MV.MVMF.MEM.SOURCE = class extends MV.MVMF.SOURCE
{
   #bIndependent;
   #pObjectHead;

   constructor (pReference, pClient, pObjectHead)
   {
      super (pReference, pClient);

      this.#bIndependent = (pReference.bIndependent != false);
      this.#pObjectHead  = pObjectHead;
   }

   initialize (pModel, twObjectIx, twChildIx)
   {
      super.initialize (pModel);

      this.#pObjectHead.twParentIx = this.#bIndependent ?          0 : twObjectIx;
      this.#pObjectHead.twObjectIx = this.#bIndependent ? twObjectIx : twChildIx;
   }

   destructor ()
   {
      this.#pObjectHead.destructor ();

      return super.destructor ();
   }

   get bIndependent () { return this.#bIndependent;           }
   get pObjectHead  () { return this.#pObjectHead;            }

   get twParentIx   ()  { return this.#pObjectHead.twParentIx;    }
   get twObjectIx   ()  { return this.#pObjectHead.twObjectIx;    }
   get wClass_Parent () { return this.#pObjectHead.wClass_Parent; }
   get wClass_Object () { return this.#pObjectHead.wClass_Object; }

   Partial    (               ) {}
   Full       (               ) {}
   Recovering (               ) {}
   Recovered  (               ) {}
   Inserted   (pChild, pChange) {}
   Deleting   (pChild, pChange) {}
   Updating   (pChild         ) {}
   Updated    (pChild         ) {}
   Changing   (pChild, pChange) {}
   Changed    (pChild, pChange) {}
}

MV.MVMF.MEM.SOURCE.REFERENCE = class extends MV.MVMF.SOURCE.REFERENCE
{
   constructor (sID_Service, sID_Model, wClass, apAction, bIndependent)
   {
      super (sID_Service, sID_Model, wClass, apAction);

      this.bIndependent = bIndependent;
   }
}

MV.MVMF.MEM.SOURCE.FACTORY = class extends MV.MVMF.SOURCE.FACTORY
{
   #pReference;

   constructor (sID_Service, sID_Model, wClass, apAction, bIndependent)
   {
      super (sID_Service, sID_Model, wClass, apAction);

      this.#pReference = new MV.MVMF.MEM.SOURCE.REFERENCE (sID_Service, sID_Model, wClass, apAction, bIndependent);
   }

   get pReference ()   { return this.#pReference; }
}

MV.MVMF.MEM.SOURCE.OBJECTHEAD = class
{
   constructor (twParentIx, twObjectIx, wClass_Parent, wClass_Object, wFlags)
   {
      this.twParentIx    = twParentIx;
      this.twObjectIx    = twObjectIx;
      this.wClass_Parent = wClass_Parent;
      this.wClass_Object = wClass_Object;
      this.wFlags        = wFlags;
   }

   destructor ()
   {
      return null;
   }
}

MV.MVMF.MEM.MODEL = class extends MV.MVMF.MODEL
{
   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      pSource.initialize (this, pReference.twObjectIx, pReference.twChildIx);
   }

   get twParentIx ()    { return this.pSource.twParentIx;    }
   get twObjectIx ()    { return this.pSource.twObjectIx;    }
   get wClass_Parent () { return this.pSource.wClass_Parent; }
   get wClass_Object () { return this.pSource.wClass_Object; }

   Partial    () {}
   Full       () {}
   Recovering () {}
   Recovered  () {}

   Inserted (pChild, pChange) {}
   Deleting (pChild, pChange) {}
   Updating (pChild         ) {}
   Updated  (pChild         ) {}
   Changing (pChild, pChange) {}
   Changed  (pChild, pChange) {}
}

MV.MVMF.MEM.MODEL.FACTORY = class extends MV.MVMF.MODEL.FACTORY
{

}

MV.MVMF.MEM.MODEL.IREFERENCE = class extends MV.MVMF.MODEL.IREFERENCE
{
   constructor (sID, twObjectIx, twChildIx)
   {
      super (sID);

      this.twObjectIx = twObjectIx;
      this.twChildIx  = twChildIx;
   }

   Key ()
   {
      return this.twObjectIx + (this.twChildIx ? '_' + this.twChildIx : '');
   }
}

MV.MVMF.MEM.MODEL.ISOURCE = class
{
   Attach () {}
   Detach () {}
}

MV.MVMF.SOURCE_SESSION = class extends MV.MVMF.SOURCE
{
   constructor (pReference, pClient)
   {
      super (pReference, pClient);

      this.bAutoConnect = true;
   }

}

MV.MVMF.SOURCE_SESSION.FACTORY = class extends MV.MVMF.SOURCE.FACTORY
{

   get bType () { return this.eTYPE.SESSION; }
}

MV.MVMF.MODEL_SESSION = class extends MV.MVMF.MODEL
{
   constructor (pReference, pSource_Session)
   {
      super (pReference, pSource_Session);

      this.twClientIx = 0;

      this.wResult = 0;

      if (pReference.bAutoConnect === false)
         pSource_Session.bAutoConnect = false;
   }

}

MV.MVMF.MODEL_SESSION.FACTORY = class extends MV.MVMF.MODEL.FACTORY
{

}

MV.MVMF.MODEL_SESSION.IREFERENCE = class extends MV.MVMF.SHAREDOBJECT.IREFERENCE
{
   constructor (sID, bAutoConnect)
   {
      super (sID);

      this.bAutoConnect = bAutoConnect;
   }

   Key ()
   {
      return '0';
   }
}

MV.MVMF.MODEL_OBJECT = class extends MV.MVMF.MEM.MODEL
{
   static eSTATE =
   {
      EMPTY     : 0,
      PARTIAL   : 1,
      FULL      : 2,
      RECOVERED : 3,
   };

   eSTATE = MV.MVMF.MODEL_OBJECT.eSTATE;

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.acpChild = {};
   }

   destructor ()
   {
      for (let sID in this.acpChild)
      {
         this.acpChild[sID].destructor ();

         delete this.acpChild[sID];
      }

      return super.destructor ();
   }

   EnumChild (sID, pThis, fnCallback, pParam)
   {
      let cpChild, pEnum, pChild;

      console.log ('pModel.EnumChild () has been deprecated. Use pModel.Child_Enum () instead. The callback function must return true to continue. pChild is returned if the callback function returns false.');

      if (cpChild = this.acpChild[sID])
      {
         if (pEnum = cpChild.Enum_Begin ())
         {
            while (pChild = cpChild.Enum_Next (pEnum))
            {
               fnCallback.call (pThis, pChild, pParam);

               cpChild.Release ();
            }

            cpChild.Enum_End (pEnum);
         }
      }
   }

   Child_Enum (sID, pThis, fnCallback, pParam)
   {
      let pChild = null;
      let pEnum, bResult = true;
      let cpChild;

      if (cpChild = this.acpChild[sID])
      {
         if (pEnum = cpChild.Enum_Begin ())
         {
            while (bResult  &&  (pChild = cpChild.Enum_Next (pEnum)) != null)
               if (bResult = fnCallback.call (pThis, pChild, pParam)  ||  true)
                  cpChild.Release ();

            cpChild.Enum_End (pEnum);
         }
      }

      return pChild;
   }

   Child_Collection (sID)
   {
      let cpChild = this.acpChild[sID];

      if (cpChild == undefined)
      {
         cpChild = new MV.MVMF.COLLECTION ();

         this.acpChild[sID] = cpChild;
      }

      return cpChild;
   }

   IsReady ()
   {
      return (this.ReadyState () == this.eSTATE.RECOVERED);
   }

   Partial ()
   {
      this.ReadyState (this.eSTATE.PARTIAL);
   }

   Full ()
   {
      this.ReadyState (this.eSTATE.FULL);
   }

   Recovering ()
   {
   }

   Recovered ()
   {
      this.ReadyState (this.eSTATE.RECOVERED);
   }

   Inserted (pChild, pChange)
   {
      let cpChild;

      if (pChild != null)
      {
         if ((cpChild = this.Child_Collection (pChild.sID)) != null)
         {
            cpChild.Add (pChild.twObjectIx + '', pChild);
         }
      }

      this.Emit ('onInserted', { pChild, pChange });
   }

   Deleting (pChild, pChange)
   {
      let cpChild;

      this.Emit ('onDeleting', { pChild, pChange });

      if (pChild != null)
      {
         if ((cpChild = this.Child_Collection (pChild.sID)) != null)
         {
            cpChild.Remove (pChild.twObjectIx);
         }
      }
   }

   Updating (pChild)
   {
      this.Emit ('onUpdating', { pChild });
   }

   Updated (pChild)
   {
      this.Emit ('onUpdated', { pChild });
   }

   Changing (pChild, pChange)
   {
      this.Emit ('onChanging', { pChild, pChange });
   }

   Changed  (pChild, pChange)
   {
      this.Emit ('onChanged', { pChild, pChange });
   }
}

MV.MVMF.MODEL_OBJECT.FACTORY = class extends MV.MVMF.MEM.MODEL.FACTORY
{

}

MV.MVMF.MODEL_OBJECT.IREFERENCE = class extends MV.MVMF.MEM.MODEL.IREFERENCE
{

}

MV.MVMF.SESSION_NULL = class extends MV.MVMF.MODEL_SESSION
{
   static factory ()
   {
      return new this.FACTORY ('Session_Null');
   }

   static eSTATE =
   {
      DISCONNECTED           : 0,
      CONNECTED              : 1,
      LOGGEDOUT              : 2,
   };

   eSTATE = MV.MVMF.SESSION_NULL.eSTATE;

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
      return true;
   }

   IsLoggedIn ()
   {
      return false;
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
      return false;
   }

   Logout ()
   {
      return false;
   }
}

MV.MVMF.SESSION_NULL.FACTORY = class extends MV.MVMF.MODEL_SESSION.FACTORY
{

   Reference (asArgs)
   {
      let bAutoConnect = (asArgs[0] == 'false') ? false : true;

      return new MV.MVMF.SESSION_NULL.IREFERENCE (this.sID, bAutoConnect);
   }
}

MV.MVMF.SESSION_NULL.IREFERENCE = class extends MV.MVMF.MODEL_SESSION.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVMF.SESSION_NULL (this, pSource);
   }
}

MV.MVMF.SESSION_UIP = class extends MV.MVMF.MODEL_SESSION
{
   static factory ()
   {
      return new this.FACTORY ('Session_UiP');
   }

   static eSTATE =
   {
      DISCONNECTED           : 0,
      CONNECTED              : 1,
      LOGGEDOUT              : 2,
      LOGGING                : 3,
      LOGGINGIN              : 3,
      LOGGINGIN_PASSWORD     : 4,
      LOGGEDIN               : 5,
   };

   eSTATE = MV.MVMF.SESSION_UIP.eSTATE;

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
      return (this.ReadyState () == this.eSTATE.LOGGEDOUT  &&  this.pSource.IsLoggedOut ());
   }

   IsLoggedIn ()
   {
      return (this.ReadyState () == this.eSTATE.LOGGEDIN   &&  this.pSource.IsLoggedIn  ());
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

      return this.pSource.Login (pSession.username, pSession.password, pSession.remember == 'true' ? true : false);
   }

   Logout ()
   {
      return this.pSource.Logout ();
   }
}

MV.MVMF.SESSION_UIP.FACTORY = class extends MV.MVMF.MODEL_SESSION.FACTORY
{

   Reference (asArgs)
   {
      let bAutoConnect = (asArgs[0] == 'false') ? false : true;

      return new MV.MVMF.SESSION_UIP.IREFERENCE (this.sID, bAutoConnect);
   }
}

MV.MVMF.SESSION_UIP.IREFERENCE = class extends MV.MVMF.MODEL_SESSION.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVMF.SESSION_UIP (this, pSource);
   }
}

MV.MVMF.SESSION_C2A = class extends MV.MVMF.MODEL_SESSION
{
   static factory ()
   {
      return new this.FACTORY ('Session_C2a');
   }

   static eSTATE =
   {
      DISCONNECTED           : 0,
      CONNECTED              : 1,
      LOGGEDOUT              : 2,
      LOGGING                : 8,
      LOGGINGIN_NOTOKEN      : 3,
      LOGGINGIN_OLDTOKEN     : 4,
      LOGGINGIN_AUTHENTICATE : 5,
      LOGGINGIN_NEWTOKEN     : 6,
      LOGGEDIN               : 7,
   };

   eSTATE = MV.MVMF.SESSION_C2A.eSTATE;

   get pLogin ()     { return this.pSource.pLogin; }
   get twUserIx ()   { return this.pSource.pLogin ? this.pSource.pLogin.twUserIx : 0; }

   Progress (pProgress)
   {
      this.Emit ('onProgress', pProgress);
   }

   LoggedOut ()
   {
      this.pSource.Logout ();
   }

   IsLoggedOut ()
   {
      return (this.ReadyState () == this.eSTATE.LOGGEDOUT  &&  this.pSource.IsLoggedOut ());
   }

   IsLoggedIn ()
   {
      return (this.ReadyState () == this.eSTATE.LOGGEDIN   &&  this.pSource.IsLoggedIn  ());
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

      return this.pSource.Login (pSession.contact, pSession.password, pSession.remember == 'true' ? true : false);
   }

   Authenticate (bPublic)
   {
      return this.pSource.Authenticate (bPublic);
   }

   Logout ()
   {
      return this.pSource.Logout ();
   }
}

MV.MVMF.SESSION_C2A.FACTORY = class extends MV.MVMF.MODEL_SESSION.FACTORY
{

   Reference (asArgs)
   {
      let bAutoConnect = (asArgs[0] == 'false') ? false : true;

      return new MV.MVMF.SESSION_C2A.IREFERENCE (this.sID, bAutoConnect);
   }
}

MV.MVMF.SESSION_C2A.IREFERENCE = class extends MV.MVMF.MODEL_SESSION.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVMF.SESSION_C2A (this, pSource);
   }
}

MV.MVMF.Escape = function (s)
{
   return s.replace (/\\|=|;/g, function (c) { return '\\' + c; });
}

MV.MVMF.Unescape = function (s)
{
   return s.replace (/\\./g, function (cc) { return cc[1]; });
}

MV.MVMF.Encode = function (pObject)
{
   let sObject = '';

   for (let sKey in pObject)
   {
      let sKeyE   = MV.MVMF.Escape (             sKey );
      let sValueE = MV.MVMF.Escape ('' + pObject[sKey]);

      sObject += (sObject.length > 0 ? ';' : '') + sKeyE + '=' + sValueE;
   }

   return sObject;
}

MV.MVMF.Decode = function (sObject)
{
   let pObject = {};

   let aObject = sObject.match (/(\\.|[^;])+/g);

   for (let i=0; i<aObject.length; i++)
   {
      let aPropertyE = aObject[i].match (/(\\.|[^=])+/g);

      if (aPropertyE.length == 1)
         aPropertyE[1] = '';

      if (aPropertyE.length == 2)
      {
         let sKey   = MV.MVMF.Unescape (aPropertyE[0]);
         let sValue = MV.MVMF.Unescape (aPropertyE[1]);

         pObject[sKey.toLowerCase ().trim ()] = sValue.trim ();
      }
   }

   return pObject;
}

MV.MVMF.PLUGIN = class
{
   #cpFactory;
   #cpFactoryPkg;
   #nInstalled = 0;
   #bInstalled = false;
   #sopPackage;

   constructor (pLibrary)
   {
      this.pLibrary = pLibrary;

      this.sID      = pLibrary.sID;
      this.sName    = pLibrary.Title;
      this.sVersion = pLibrary.Version;

      this.#cpFactory      = new MV.MVMF.COLLECTION ();
      this.#cpFactoryPkg   = new MV.MVMF.COLLECTION ();
      this.#sopPackage     = new MV.MVMF.SHAREDOBJECT ();
   }

   destructor ()
   {
      this.#cpFactory      = this.#cpFactory   .destructor ();
      this.#cpFactoryPkg   = this.#cpFactoryPkg.destructor ();
      this.#sopPackage     = this.#sopPackage  .destructor ();

      return null;
   }

   Install (pCore)
   {
      if (this.#nInstalled++ == 0)
      {
         this.#bInstalled = this.pLibrary.Install (pCore, this);

         console.log ('Installing plugin: ' + this.sID + ' (' + this.sVersion + ')');
      }

      return this.#bInstalled;
   }

   Unstall (pCore)
   {
      if (--this.#nInstalled == 0)
      {
         console.log ('Unstalling plugin: ' + this.sID);

         this.pLibrary.Unstall (pCore, this);

         this.#bInstalled = false;
      }
   }

   AddPackage (pFactory_Package, sNamespace)
   {
      let bResult = true;
      let pReference, pPackage;

      if ((pReference = pFactory_Package.Reference (sNamespace)) != null)
      {
         let pDummy = {};

         if (pPackage = this.#sopPackage.Open (pReference, pDummy))
         {
            if (pPackage.IsLoaded ())
            {
               if (pDummy == this.#sopPackage.Param (pPackage.sKey))
               {
                  if (pPackage.Install () == false)
                  {
                     console.log ('Failed to install Package: ' + pPackage.sKey);

                     bResult = false;
                  }
               }

               if (bResult == false)
               {
                  this.#sopPackage.Close (pPackage.sKey);

                  pPackage = null;
               }
            }
         }
      }

      return bResult;
   }

   InstallPackages (sID_Service, sNamespace, sID_Package)
   {
      let bResult = true;
      let pEnum, pFactory_Package;

      if (sID_Package)
      {
         if (pFactory_Package = this.#cpFactoryPkg.Get (MV.MVMF.PLUGIN.PACKAGE.FACTORY.toID (sID_Service, sID_Package)))
         {
            this.AddPackage (pFactory_Package, sNamespace);

            this.#cpFactory.Release ();
         }
      }
      else
      {
         if ((pEnum = this.#cpFactoryPkg.Enum_Begin ()) != null)
         {
            while ((pFactory_Package = this.#cpFactoryPkg.Enum_Next (pEnum)) != null)
            {
               if (pFactory_Package.sID_Service == sID_Service)
               {
                  this.AddPackage (pFactory_Package, sNamespace);
               }

               this.#cpFactoryPkg.Release ();
            }

            this.#cpFactoryPkg.Enum_End (pEnum);
         }
      }

      return bResult;
   }

   Factory_Services (apFactory)
   {
      let n;

      for (n=0; n<apFactory.length; n++)
         this.#cpFactory.Add ('service/' + apFactory[n].sID, apFactory[n]);
   }

   Factory_Models (apFactory)
   {
      let n;

      for (n=0; n<apFactory.length; n++)
         this.#cpFactory.Add ('model/' + apFactory[n].sID, apFactory[n]);
   }

   Factory_Sources (apFactory)
   {
      let n;

      for (n=0; n<apFactory.length; n++)
         this.#cpFactory.Add ('source/' + apFactory[n].pReference.sID_Service + ':' + apFactory[n].pReference.sID_Model, apFactory[n]);
   }

   Factory_Packages (apFactory)
   {
      let n;

      for (n=0; n<apFactory.length; n++)
         this.#cpFactoryPkg.Add (apFactory[n].sID, apFactory[n]);
   }

   Factory (sType, sID)
   {
      let pFactory;

      if (pFactory = this.#cpFactory.Get (sType + '/' + sID))
      {
         this.#cpFactory.Release ();
      }

      return pFactory;
   }
}

MV.MVMF.PLUGIN.IREFERENCE = class extends MV.MVMF.SHAREDOBJECT.IREFERENCE
{

   Key ()
   {
      return this.UniqueId ();
   }

   Create (pLibrary)
   {
      return new MV.MVMF.PLUGIN (pLibrary);
   }
}

MV.MVMF.PLUGIN.PACKAGE = class
{
   #sNamespace;
   #nFailure          = 0;
   #apFactory_Service = [];
   #apFactory_Model   = [];
   #apFactory_Source  = [];
   #sKey;
   #sID;

   constructor (pReference, pParam)
   {
      this.#sID     = pReference.UniqueId ();
      this.#sKey    = pReference.Key      ();

      this.#sNamespace = pReference.sNamespace || '';

      let a, n, pFactory;
      let pConfig = pReference.pConfig;

      if (pConfig)
      {
         if (a = pConfig.aService)
         {
            for (n=0; n<a.length; n++)
               if (pFactory = MV.MVMF.Core.Plugin_Factory ('service', a[n]))
               {
                  this.#apFactory_Service.push (pFactory);

               }
               else
               {
                  this.#nFailure++;
                  console.log ('Package: Unknown service: ' + a[n]);
               }
         }

         if (a = pConfig.aModel)
         {
            for (n=0; n<a.length; n++)
               if (pFactory = MV.MVMF.Core.Plugin_Factory ('model', a[n]))
               {
                  this.#apFactory_Model.push (pFactory);

               }
               else
               {
                  this.#nFailure++;
                  console.log ('Package: Unknown model: ' + a[n]);
               }
         }

         if (a = pConfig.aSource)
         {
            for (n=0; n<a.length; n++)
               if (pFactory = MV.MVMF.Core.Plugin_Factory ('source', a[n]))
               {
                  this.#apFactory_Source.push (pFactory);

               }
               else
               {
                  this.#nFailure++;
                  console.log ('Package: Unknown source: ' + a[n]);
               }
         }
      }
   }

   destructor ()
   {
      while (this.#apFactory_Source.length > 0)
      {

         this.#apFactory_Source.splice (0, 1);
      }

      while (this.#apFactory_Model.length > 0)
      {

         this.#apFactory_Model.splice (0, 1);
      }

      while (this.#apFactory_Service.length > 0)
      {

         this.#apFactory_Service.splice (0, 1);
      }

      return null;
   }

   get sID        () { return this.#sID;                }
   get sKey       () { return this.#sKey;               }

   IsLoaded ()
   {
      return (this.#nFailure == 0);
   }

   Install ()
   {
      let bResult = true;
      let pNamespace, n;

      if (pNamespace = MV.MVMF.Core.Namespace_Add (this.#sNamespace))
      {
         for (n=0; n<this.#apFactory_Service.length; n++)
            if (pNamespace.ServiceClass_Add (this.#apFactory_Service[n]) == false)
            {
               bResult = false;
               console.log ('Package: Failed to install service: ' + this.#apFactory_Service[n].sID);
            }

         for (n=0; n<this.#apFactory_Model.length; n++)
            if (pNamespace.ModelClass_Add (this.#apFactory_Model[n]) == false)
            {
               bResult = false;
               console.log ('Package: Failed to install model: ' + this.#apFactory_Model[n].sID);
            }

         for (n=0; n<this.#apFactory_Source.length; n++)
            if (pNamespace.SourceClass_Add (this.#apFactory_Source[n]) == false)
            {
               bResult = false;
               console.log ('Package: Failed to install source: ' + this.#apFactory_Source[n].pReference.sID_Service + ' > ' + this.#apFactory_Source[n].pReference.sID_Model);
            }

         MV.MVMF.Core.Namespace_Release ();
      }

      return bResult;
   }

   Unstall ()
   {
      let pNamespace, n;

      if (pNamespace = MV.MVMF.Core.Namespace_Get (this.#sNamespace))
      {
         for (n=0; n<this.#apFactory_Source.length; n++)
            if (pNamespace.SourceClass_Remove (this.#apFactory_Source[n].pReference.sID_Service, this.#apFactory_Source[n].pReference.sID_Model) == false)
               console.log ('Package: Failed to unstall source: ' + this.#apFactory_Source[n].pReference.sID_Service + ' > ' + this.#apFactory_Source[n].pReference.sID_Model);

         for (n=0; n<this.#apFactory_Model.length; n++)
            if (pNamespace.ModelClass_Remove (this.#apFactory_Model[n].sID) == false)
               console.log ('Package: Failed to unstall model: ' + this.#apFactory_Model[n].sID);

         for (n=0; n<this.#apFactory_Service.length; n++)
            if (pNamespace.ServiceClass_Remove (this.#apFactory_Service[n].sID) == false)
               console.log ('Package: Failed to unstall service: ' + this.#apFactory_Service[n].sID);

         MV.MVMF.Core.Namespace_Release ();
      }
   }
}

MV.MVMF.PLUGIN.PACKAGE.FACTORY = class extends MV.MVMF.FACTORY
{
   #sID;
   #sID_Service;
   #pConfig;

   constructor (sID_Service, sID_Package, pConfig)
   {
      super ();

      this.#sID_Service = sID_Service;
      this.#sID         = MV.MVMF.PLUGIN.PACKAGE.FACTORY.toID (sID_Service, sID_Package);
      this.#pConfig     = pConfig;
   }

   destructor ()
   {
      return null;
   }

   static toID (sID_Service, sID_Package)
   {
      return sID_Service + ':' + sID_Package;
   }

   get sID ()           { return this.#sID;           }
   get sID_Service ()   { return this.#sID_Service;   }
   get pConfig ()       { return this.#pConfig;       }
}

MV.MVMF.PLUGIN.PACKAGE.IREFERENCE = class extends MV.MVMF.SHAREDOBJECT.IREFERENCE
{
   constructor (sID, sNamespace, pConfig)
   {
      super (sID);

      this.sNamespace = sNamespace;
      this.pConfig    = pConfig;
   }

   Key ()
   {
      return this.UniqueId () + '/' + this.sNamespace;
   }
}

MV.MVMF.LNG = class extends MV.MVMF.NOTIFICATION
{
   static eSTATE =
   {
      DISCONNECTED : 0,
      CONNECTING   : 1,
      LOGGEDOUT    : 2,
      LOGGING      : 3,
      LOGGEDIN     : 4,
   };

   eSTATE = MV.MVMF.LNG.eSTATE;

   #pService;
   #pClient;
   #pSession;
   #sSession;

   constructor (sNamespace, sID_Service, sConnect, sSession)
   {
      super ();

      if (this.#pService = MV.MVMF.Core.Service_Open (sNamespace, sID_Service, sConnect))
      {
         this.#pService.Attach (this, true);

         if (this.#pClient = this.#pService.Client_Open (1))
         {
            this.#pClient.Attach (this, true);

            if (this.#pSession = this.#pClient.Session_Open (true))
            {
               this.#pSession.Attach (this, true);

               this.#sSession = sSession;
            }
         }
      }
   }

   SafeClose ()
   {
      return new Promise ((resolve, reject) => {
         const checkCondition = () => {
            if (this.#pClient.SafeKill ())
            {
               resolve ();
            }
            else
            {
               setTimeout (checkCondition, 100);
            }
         };

         checkCondition ();
      });
   }

   async destructor ()
   {
      if (this.#pService)
      {
         if (this.#pClient)
         {
            if (this.#pSession)
            {
               if (this.#sSession)
               {
                  this.#sSession = undefined;
               }

               this.#pSession.Detach (this);

               await this.SafeClose ();

               this.#pSession = this.#pClient.Session_Close (this.#pSession);
            }
            else
            {
               await this.SafeClose ();
            }

            this.#pClient.Detach (this);

            this.#pClient = this.#pService.Client_Close (this.#pClient);
         }

         this.#pService.Detach (this);

         this.#pService = this.#pService.pNamespace.Service_Close (this.#pService);
      }

      return super.destructor ();
   }

   get pNamespace () { return this.#pService.pNamespace; }
   get sNamespace () { return this.#pService.sNamespace; }
   get pService   () { return this.#pService;            }
   get pClient    () { return this.#pClient;             }
   get pSession   () { return this.#pSession;            }

   #Login_Call ()
   {
      let bResult = false;

      if (this.#sSession)
      {
         if (this.#pSession.Login (this.#sSession))
         {
            this.ReadyState (this.eSTATE.LOGGING);

            bResult = true;
         }

         this.#sSession = undefined;
      }

      return bResult;
   }

   onReadyState (pNotify)
   {
      if (this.#pSession)
      {
         if (this.#pClient.IsDisconnected ())
         {
            this.ReadyState (this.eSTATE.DISCONNECTED);
         }
         else if (this.#pClient.IsConnected ())
         {
            if (this.#pSession.IsLoggedOut ())
            {
               if (this.#Login_Call () == false)
                  this.ReadyState (this.eSTATE.LOGGEDOUT);
            }
            else if (this.#pSession.IsLoggedIn ())
            {
               this.ReadyState (this.eSTATE.LOGGEDIN);
            }
            else this.ReadyState (this.eSTATE.LOGGING);
         }
         else this.ReadyState (this.eSTATE.CONNECTING);
      }
   }

   IsReady ()
   {
      let nReadyState = this.ReadyState ();

      return (nReadyState == this.eSTATE.LOGGEDIN || nReadyState == this.eSTATE.LOGGEDOUT);
   }

   Model_Open (sID_Model, sArgs)
   {
      return this.#pClient.Model_Open (sID_Model, sArgs);
   }

   Model_Close (pModel)
   {
      return (pModel != null) ? this.#pClient.Model_Close (pModel) : null;
   }

   Login (sSession)
   {
      let bResult = true;

      if (this.#pSession)
      {
         this.#sSession = sSession;

         if (this.#pClient.IsConnected ())
         {
            if (this.#pSession.IsLoggedOut ())
            {
               if (this.#sSession)
               {
                  bResult = this.#Login_Call ();
               }
            }
         }
      }
      else bResult = false;

      return bResult;
   }

   Logout ()
   {
      let bResult = false;

      if (this.#pSession.Logout ())
      {
         this.ReadyState (this.eSTATE.LOGGING);

         bResult = true;
      }

      this.#sSession = undefined;

      return bResult;
   }
}

MV.MVMF.LNG.ICOMPARE = class extends MV.MVMF.COLLECTION.ICOMPARE
{

   Compare (pThis, pLnG) { return (pThis == pLnG); }
}

MV.MVMF.MODEL_EX = class
{
   #m_pThis;
   #m_pLnG;
   #m_pModel;
   #m_nReadyState;

   constructor (pLnG, pThis, sID, twObjectIx, twChildIx, nReadyState)
   {
      this.#m_pLnG      = pLnG;
      this.#m_pThis     = pThis;

      this.#m_pModel       = pLnG.Model_Open (sID, '' + twObjectIx, twChildIx);
      this.#m_nReadyState  = (nReadyState === undefined) ? this.#m_pModel.eSTATE.RECOVERED : nReadyState;
      this.#m_pModel.Attach (this);
   }

   destructor ()
   {
      this.#m_pModel.Detach (this);
      this.#m_pLnG.Model_Close (this.#m_pModel);

      return null;
   }

   get pModel ()
   {
      return this.#m_pModel;
   }

   onInserted (pNotice)
   {
      this.#FwdNotice (pNotice, 'onInserted');
   }

   onUpdated (pNotice)
   {
      this.#FwdNotice (pNotice, 'onUpdated');
   }

   onChanged (pNotice)
   {
      this.#FwdNotice (pNotice, 'onChanged');
   }

   onDeleting (pNotice)
   {
      this.#FwdNotice (pNotice, 'onDeleting');
   }

   onReadyState (pNotice)
   {
      if (this.#m_pModel.ReadyState () >= this.#m_nReadyState)
      {
         this.#m_pThis.onReadyState (pNotice);
      }
   }

   #FwdNotice (pNotice, sType)
   {
      if (this.#m_pModel.ReadyState () >= this.#m_nReadyState)
      {
         this.#m_pThis.onModelNotify (pNotice, sType);
      }
   }

   IsReady ()
   {
      return (this.#m_pModel.ReadyState () >= this.#m_nReadyState);
   }
}

MV.MVMF.Core        = new MV.MVMF.CORE ();

MV.MVMF.Cookie      = new MV.MVMF.COOKIE      ();
MV.MVMF.Storage     = new MV.MVMF.STORAGE     ();
MV.MVMF.Fingerprint = new MV.MVMF.FINGERPRINT ();

MV.MVMF.Install = function (pCore, pPlugin)
{
   let bResult = true;

   this.apFactory_Model =
   [
      MV.MVMF.SESSION_NULL.factory (),
      MV.MVMF.SESSION_C2A .factory (),
      MV.MVMF.SESSION_UIP .factory (),
   ];

   pPlugin.Factory_Models (this.apFactory_Model);

   return bResult;
}

MV.MVMF.Unstall = function (pCore, pPlugin)
{
   let n;

   for (n=0; n<this.apFactory_Model.length; n++)
      this.apFactory_Model[n] = this.apFactory_Model[n].destructor ();
}

/*
module.exports =
*/
/*
export
*/
/*
{
   MV
}
*/

