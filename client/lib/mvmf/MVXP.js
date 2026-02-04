
/*
import { MV   } from '@metaversalcorp/mvmf';
import '@metaversalcorp/mvsb';
*/
/*
const { MV } = require ('@metaversalcorp/mvmf');
require ('@metaversalcorp/mvsb');
*/

MV.MVXP = MV.Library ('MVXP', 'Copyright 2014-2024 Metaversal Corporation. All rights reserved.', 'Metaversal Cross Platform', '0.23.1');

MV.MVXP.Class.USER_BIRTHDATE = class extends MV.MVMF.Class.BASE
{
   constructor (wYear, bMonth, bDay)
   {
      super ();

      this.Set (wYear, bMonth, bDay);
   }

   Set (wYear, bMonth, bDay)
   {
      this.wYear  = wYear;
      this.bMonth = bMonth;
      this.bDay   = bDay;
   }

   static MAP =
   {
      wYear       : MV.MVSB.MAP.FIELD.WORD,
      bMonth      : MV.MVSB.MAP.FIELD.BYTE,
      bDay        : MV.MVSB.MAP.FIELD.BYTE,
   };
}

MV.MVXP.Class.USER_SECURITY = class extends MV.MVMF.Class.BASE
{
   constructor ()
   {
      super ();

      this.qwSettings      = undefined;
      this.abReserved_A    = undefined;
      this.abHash_Password = undefined;
      this.abHash_PIN      = undefined;
      this.abHash_RPIN     = undefined;
      this.dwRPIN          = undefined;
      this.abReserved_B    = undefined;
      this.abHash_TOTP     = undefined;
      this.qwSMS           = undefined;
   }

   static MAP =
   {
      qwSettings           : MV.MVSB.MAP.FIELD.QWORD,
      abReserved_A         : MV.MVSB.MAP.FIELD.PAD (8),
      abHash_Password      : MV.MVSB.MAP.FIELD.BINARY (24),
      abHash_PIN           : MV.MVSB.MAP.FIELD.BINARY (24),
      abHash_RPIN          : MV.MVSB.MAP.FIELD.BINARY (24),
      dwRPIN               : MV.MVSB.MAP.FIELD.DWORD,
      abReserved_B         : MV.MVSB.MAP.FIELD.PAD (4),
      abHash_TOTP          : MV.MVSB.MAP.FIELD.BINARY (24),
      qwSMS                : MV.MVSB.MAP.FIELD.QWORD
   };
}

MV.MVXP.SB_APPLIC = class extends MV.MVSB.SB_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVSB',
         'Applic',

         31,

         MV.MVXP.SB_APPLIC.apAction,

         true,

         new MV.MVSB.MAP
         ({
            sApplicId            : MV.MVSB.MAP.FIELD.STRING (31),
            bPaused              : MV.MVSB.MAP.FIELD.BYTE
         })
      );
   }

}

MV.MVXP.SB_APPLIC.FACTORY = class extends MV.MVSB.SB_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVXP.SB_APPLIC (this.pReference, this.pMap, pClient);
   }
}

MV.MVXP.SB_APPLIC.Map_Token_Out =
                           new MV.MVSB.MAP
                           ({
                              twSecureDoorTypeIx            : MV.MVSB.MAP.FIELD.TWORD8,
                              twSecureLockTypeIx            : MV.MVSB.MAP.FIELD.TWORD8,
                              twSecureDoorIx                : MV.MVSB.MAP.FIELD.TWORD8,
                              twObjectIx                    : MV.MVSB.MAP.FIELD.TWORD8,
                              tmAcquire                     : MV.MVSB.MAP.FIELD.TIME,
                              tmExpire                      : MV.MVSB.MAP.FIELD.TIME,
                              bLimit_Set                    : MV.MVSB.MAP.FIELD.BYTE,
                              bCount_Set                    : MV.MVSB.MAP.FIELD.BYTE,
                              bLimit_Unlock                 : MV.MVSB.MAP.FIELD.BYTE,
                              bCount_Unlock                 : MV.MVSB.MAP.FIELD.BYTE,
                              dwResult                      : MV.MVSB.MAP.FIELD.DWORD,
                              acToken64U                    : MV.MVSB.MAP.FIELD.STRING (64),
                           });

MV.MVXP.SB_APPLIC.Response_Eval = function (pResponse, dwResult)
{
   return dwResult ? dwResult : pResponse.dwResult;
}

MV.MVXP.SB_APPLIC.apAction =
{
   PAUSE:                  new MV.MVSB.SERVICE.CLIENT.ACTION
                           (
                              (1 | ((31) << 16)),
                              new MV.MVSB.MAP
                              ({
                                 twApplicIx                      : MV.MVSB.MAP.FIELD.TWORD8,
                              })
                           ),

   CONTINUE:               new MV.MVSB.SERVICE.CLIENT.ACTION
                           (
                              (2 | ((31) << 16)),
                              new MV.MVSB.MAP
                              ({
                                 twApplicIx                      : MV.MVSB.MAP.FIELD.TWORD8,
                              })
                           ),
};

MV.MVXP.SB_REGIONROOT = class extends MV.MVSB.SB_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVSB',
         'RegionRoot',

         32,

         MV.MVXP.SB_REGIONROOT.apAction,

         true,

         new MV.MVSB.MAP
         ({
         })
      );
   }

}

MV.MVXP.SB_REGIONROOT.FACTORY = class extends MV.MVSB.SB_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVXP.SB_REGIONROOT (this.pReference, this.pMap, pClient);
   }
}

MV.MVXP.SB_REGIONROOT.apAction = {};

MV.MVXP.SB_REGIONROOT.apAction['REGION_OPEN'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (1 | ((32) << 16)),
   new MV.MVSB.MAP
   ({
      twRegionRootIx                  : MV.MVSB.MAP.FIELD.TWORD8,
      abReserved_X                    : MV.MVSB.MAP.FIELD.PAD    (8),
      sISO2                           : MV.MVSB.MAP.FIELD.STRING (4),
      sISO3                           : MV.MVSB.MAP.FIELD.STRING (4),
      nISO                            : MV.MVSB.MAP.FIELD.INT,
      sFIPS                           : MV.MVSB.MAP.FIELD.STRING (4),
      nCCC                            : MV.MVSB.MAP.FIELD.INT,
      sCountryIx                      : MV.MVSB.MAP.FIELD.STRING (2),
      sTypeIx                         : MV.MVSB.MAP.FIELD.STRING (2),
      abReserved_A                    : MV.MVSB.MAP.FIELD.PAD    (6),
      wRegion                         : MV.MVSB.MAP.FIELD.WORD,
      sName                           : MV.MVSB.MAP.FIELD.STRING (48),
   }),
   new MV.MVSB.MAP
   ({
      twRegionIx                      : MV.MVSB.MAP.FIELD.TWORD8,
   })
);

MV.MVXP.SB_REGIONROOT.apAction['REGION_CLOSE'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (2 | ((32) << 16)),
   new MV.MVSB.MAP
   ({
      twRegionRootIx                  : MV.MVSB.MAP.FIELD.TWORD8,
      twRegionIx                      : MV.MVSB.MAP.FIELD.TWORD8,
   })
);

MV.MVXP.SB_REGION = class extends MV.MVSB.SB_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVSB',
         'Region',

         33,

         MV.MVXP.SB_REGION.apAction,

         true,

         new MV.MVSB.MAP
         ({
            sISO2                : MV.MVSB.MAP.FIELD.STRING (4),
            sISO3                : MV.MVSB.MAP.FIELD.STRING (4),
            nISO                 : MV.MVSB.MAP.FIELD.INT,
            sFIPS                : MV.MVSB.MAP.FIELD.STRING (4),
            nCCC                 : MV.MVSB.MAP.FIELD.INT,
            sCountryIx           : MV.MVSB.MAP.FIELD.STRING (2),
            sTypeIx              : MV.MVSB.MAP.FIELD.STRING (2),
            abReserved_A         : MV.MVSB.MAP.FIELD.PAD    (6),
            wRegion              : MV.MVSB.MAP.FIELD.WORD,
            sName                : MV.MVSB.MAP.FIELD.STRING (48),
         })
      );
   }

}

MV.MVXP.SB_REGION.FACTORY = class extends MV.MVSB.SB_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVXP.SB_REGION (this.pReference, this.pMap, pClient);
   }
}

MV.MVXP.SB_REGION.apAction = {};

MV.MVXP.SB_REGION.apAction['STATE_OPEN'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (2 | ((33) << 16)),
   new MV.MVSB.MAP
   ({
      twRegionIx                       : MV.MVSB.MAP.FIELD.TWORD8,
      abReserved_X                     : MV.MVSB.MAP.FIELD.PAD    (8),
      sISO2                            : MV.MVSB.MAP.FIELD.STRING (4),
      abReserved_A                     : MV.MVSB.MAP.FIELD.PAD    (16),
      sRegionIx                        : MV.MVSB.MAP.FIELD.STRING (2),
      sTypeIx                          : MV.MVSB.MAP.FIELD.STRING (2),
      abReserved_B                     : MV.MVSB.MAP.FIELD.PAD    (8),
      sName                            : MV.MVSB.MAP.FIELD.STRING (48),
   }),
   new MV.MVSB.MAP
   ({
      twStateIx                        : MV.MVSB.MAP.FIELD.TWORD8,
   })
);

MV.MVXP.SB_REGION.apAction['STATE_CLOSE'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (3 | ((33) << 16)),
   new MV.MVSB.MAP
   ({
      twRegionIx                       : MV.MVSB.MAP.FIELD.TWORD8,
      twStateIx                        : MV.MVSB.MAP.FIELD.TWORD8,
   })
);

MV.MVXP.SB_REGION.apAction['STATE_UPDATE'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (4 | ((33) << 16)),
   new MV.MVSB.MAP
   ({
      twRegionIx                       : MV.MVSB.MAP.FIELD.TWORD8,
      twStateIx                        : MV.MVSB.MAP.FIELD.TWORD8,
      sISO2                            : MV.MVSB.MAP.FIELD.STRING (4),
      abReserved_A                     : MV.MVSB.MAP.FIELD.PAD    (16),
      sRegionIx                        : MV.MVSB.MAP.FIELD.STRING (2),
      sTypeIx                          : MV.MVSB.MAP.FIELD.STRING (2),
      abReserved_B                     : MV.MVSB.MAP.FIELD.PAD    (8),
      sName                            : MV.MVSB.MAP.FIELD.STRING (48),
   })
);

MV.MVXP.SB_REGION.apAction['IPRANGE_OPEN'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (5 | ((33) << 16)),
   new MV.MVSB.MAP
   ({
      twRegionIx                       : MV.MVSB.MAP.FIELD.TWORD8,
      abReserved_X                     : MV.MVSB.MAP.FIELD.PAD (8),
      dwIPAddress                      : MV.MVSB.MAP.FIELD.DWORD,
      dwIPAddress_Mask                 : MV.MVSB.MAP.FIELD.DWORD,
      sRegionIx                        : MV.MVSB.MAP.FIELD.STRING (2),
      sStateIx                         : MV.MVSB.MAP.FIELD.STRING (2),
      abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (3),
      bState                           : MV.MVSB.MAP.FIELD.BYTE,
   }),
   new MV.MVSB.MAP
   ({
      twIPRangeIx                      : MV.MVSB.MAP.FIELD.TWORD8,
   })
);

MV.MVXP.SB_REGION.apAction['IPRANGE_CLOSE'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (6 | ((33) << 16)),
   new MV.MVSB.MAP
   ({
      twRegionIx                       : MV.MVSB.MAP.FIELD.TWORD8,
      twIPRangeIx                      : MV.MVSB.MAP.FIELD.TWORD8,
   })
);

MV.MVXP.SB_REGION.apAction['IPRANGE_UPDATE'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (7 | ((33) << 16)),
   new MV.MVSB.MAP
   ({
      twRegionIx                       : MV.MVSB.MAP.FIELD.TWORD8,
      twIPRangeIx                      : MV.MVSB.MAP.FIELD.TWORD8,
      dwIPAddress                      : MV.MVSB.MAP.FIELD.DWORD,
      dwIPAddress_Mask                 : MV.MVSB.MAP.FIELD.DWORD,
      sRegionIx                        : MV.MVSB.MAP.FIELD.STRING (2),
      sStateIx                         : MV.MVSB.MAP.FIELD.STRING (2),
      abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (3),
      bState                           : MV.MVSB.MAP.FIELD.BYTE,
   })
);

MV.MVXP.SB_REGION.apAction['IPRANGE_STATE'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (8 | ((33) << 16)),
   new MV.MVSB.MAP
   ({
      twRegionIx                       : MV.MVSB.MAP.FIELD.TWORD8,
      twIPRangeIx                      : MV.MVSB.MAP.FIELD.TWORD8,
      bState                           : MV.MVSB.MAP.FIELD.BYTE,
      abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (7),
   })
);

MV.MVXP.SB_REGION.apAction['DOMAIN_OPEN'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (9 | ((33) << 16)),
   new MV.MVSB.MAP
   ({
      twRegionIx                       : MV.MVSB.MAP.FIELD.TWORD8,
      abReserved_X                     : MV.MVSB.MAP.FIELD.PAD (8),
      sDomain                          : MV.MVSB.MAP.FIELD.STRING (48),
      abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (15),
      bState                           : MV.MVSB.MAP.FIELD.BYTE,
   }),
   new MV.MVSB.MAP
   ({
      twDomainIx                       : MV.MVSB.MAP.FIELD.TWORD8,
   })
);

MV.MVXP.SB_REGION.apAction['DOMAIN_CLOSE'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (10 | ((33) << 16)),
   new MV.MVSB.MAP
   ({
      twRegionIx                       : MV.MVSB.MAP.FIELD.TWORD8,
      twDomainIx                       : MV.MVSB.MAP.FIELD.TWORD8,
   })
);

MV.MVXP.SB_REGION.apAction['DOMAIN_UPDATE'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (11 | ((33) << 16)),
   new MV.MVSB.MAP
   ({
      twRegionIx                       : MV.MVSB.MAP.FIELD.TWORD8,
      twDomainIx                       : MV.MVSB.MAP.FIELD.TWORD8,
      sDomain                          : MV.MVSB.MAP.FIELD.STRING (48),
      abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (15),
      bState                           : MV.MVSB.MAP.FIELD.BYTE,
   })
);

MV.MVXP.SB_REGION.apAction['DOMAIN_STATE'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (12 | ((33) << 16)),
   new MV.MVSB.MAP
   ({
      twRegionIx                       : MV.MVSB.MAP.FIELD.TWORD8,
      twDomainIx                       : MV.MVSB.MAP.FIELD.TWORD8,
      bState                           : MV.MVSB.MAP.FIELD.BYTE,
      abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (7),
   })
);

MV.MVXP.SB_REGION.apAction['SMSPREFIX_OPEN'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (13 | ((33) << 16)),
   new MV.MVSB.MAP
   ({
      twRegionIx                       : MV.MVSB.MAP.FIELD.TWORD8,
      twSMSPrefixIx                    : MV.MVSB.MAP.FIELD.TWORD8,
   })
);

MV.MVXP.SB_REGION.apAction['SMSPREFIX_CLOSE'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (14 | ((33) << 16)),
   new MV.MVSB.MAP
   ({
      twRegionIx                       : MV.MVSB.MAP.FIELD.TWORD8,
      twSMSPrefixIx                    : MV.MVSB.MAP.FIELD.TWORD8,
   })
);

MV.MVXP.SB_REGION.apAction['SMSFORMAT_OPEN'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (15 | ((33) << 16)),
   new MV.MVSB.MAP
   ({
      twRegionIx                       : MV.MVSB.MAP.FIELD.TWORD8,
      twSMSFormatIx                    : MV.MVSB.MAP.FIELD.TWORD8,
      sFormat                          : MV.MVSB.MAP.FIELD.STRING (16),
   }),
   new MV.MVSB.MAP
   ({
      twSMSFormatIx                    : MV.MVSB.MAP.FIELD.TWORD8,
   })
);

MV.MVXP.SB_REGION.apAction['SMSFORMAT_CLOSE'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (16 | ((33) << 16)),
   new MV.MVSB.MAP
   ({
      twRegionIx                       : MV.MVSB.MAP.FIELD.TWORD8,
      twSMSFormatIx                    : MV.MVSB.MAP.FIELD.TWORD8,
   })
);

MV.MVXP.SB_REGION.apAction['SMSFORMAT_UPDATE'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (17 | ((33) << 16)),
   new MV.MVSB.MAP
   ({
      twRegionIx                       : MV.MVSB.MAP.FIELD.TWORD8,
      twSMSFormatIx                    : MV.MVSB.MAP.FIELD.TWORD8,
      sFormat                          : MV.MVSB.MAP.FIELD.STRING (16),
   })
);

MV.MVXP.SB_REGION_SMSPREFIX = class extends MV.MVSB.SB_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVSB',
         'Region_SMSPrefix',

         37,

         MV.MVXP.SB_REGION_SMSPREFIX.apAction,

         false,

         new MV.MVSB.MAP
         ({
         })
      );
   }

}

MV.MVXP.SB_REGION_SMSPREFIX.FACTORY = class extends MV.MVSB.SB_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVXP.SB_REGION_SMSPREFIX (this.pReference, this.pMap, pClient);
   }
}

MV.MVXP.SB_REGION_SMSFORMAT = class extends MV.MVSB.SB_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVSB',
         'Region_SMSFormat',

         38,

         MV.MVXP.SB_REGION_SMSFORMAT.apAction,

         false,

         new MV.MVSB.MAP
         ({
            sFormat           : MV.MVSB.MAP.FIELD.STRING (16),
         })
      );
   }

}

MV.MVXP.SB_REGION_SMSFORMAT.FACTORY = class extends MV.MVSB.SB_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVXP.SB_REGION_SMSFORMAT (this.pReference, this.pMap, pClient);
   }
}

MV.MVXP.SB_USERROOT = class extends MV.MVSB.SB_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVSB',
         'UserRoot',

         39,

         MV.MVXP.SB_USERROOT.apAction,

         true,

         new MV.MVSB.MAP
         ({
         })
      );
   }

}

MV.MVXP.SB_USERROOT.FACTORY = class extends MV.MVSB.SB_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVXP.SB_USERROOT (this.pReference, this.pMap, pClient);
   }
}

MV.MVXP.SB_USERROOT.apAction = {};

MV.MVXP.SB_USERROOT.apAction['PAUSE'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (1 | ((39) << 16)),
   new MV.MVSB.MAP
   ({
      twUserRootIx                  : MV.MVSB.MAP.FIELD.TWORD8,
   }),
);

MV.MVXP.SB_USERROOT.apAction['CONTINUE'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (2 | ((39) << 16)),
   new MV.MVSB.MAP
   ({
      twUserRootIx                  : MV.MVSB.MAP.FIELD.TWORD8,
   }),
);

MV.MVXP.SB_USERROOT.apAction['PURGE'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (3 | ((39) << 16)),
   new MV.MVSB.MAP
   ({
      twUserRootIx                  : MV.MVSB.MAP.FIELD.TWORD8,
      abReserved_X                  : MV.MVSB.MAP.FIELD.PAD (8),
      Edge_twConnectionIx           : MV.MVSB.MAP.FIELD.TWORD,
      Edge_wInterface_ServerIx      : MV.MVSB.MAP.FIELD.WORD,
      Auth_twConnectionIx           : MV.MVSB.MAP.FIELD.TWORD,
      Auth_wInterface_ServerIx      : MV.MVSB.MAP.FIELD.WORD,
   }),
);

MV.MVXP.SB_USERROOT.apAction['BOOT'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (4 | ((39) << 16)),
   new MV.MVSB.MAP
   ({
      twUserRootIx                  : MV.MVSB.MAP.FIELD.TWORD8,
      twUserIx                      : MV.MVSB.MAP.FIELD.TWORD8,
      dwReason                      : MV.MVSB.MAP.FIELD.DWORD,
      abReserved_A                  : MV.MVSB.MAP.FIELD.PAD (4),
   }),
);

MV.MVXP.SB_USERROOT.apAction['USER_OPEN'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (7 | ((39) << 16)),
   new MV.MVSB.MAP
   ({
      twUserRootIx                  : MV.MVSB.MAP.FIELD.TWORD8,
      abReserved_X                  : MV.MVSB.MAP.FIELD.PAD (8),
      sContact                      : MV.MVSB.MAP.FIELD.STRING (64),
      sPassword                     : MV.MVSB.MAP.FIELD.STRING_W (32),
      bTerms                        : MV.MVSB.MAP.FIELD.BYTE,
      bAdult                        : MV.MVSB.MAP.FIELD.BYTE,
      abReserved_A                  : MV.MVSB.MAP.FIELD.PAD (10),
      dwIPAddress_WAN               : MV.MVSB.MAP.FIELD.PAD (4),
      qwClientSessionIx             : MV.MVSB.MAP.FIELD.QWORD,
   }),
   new MV.MVSB.MAP
   ({
      twUserIx                      : MV.MVSB.MAP.FIELD.TWORD8,
   })
);

MV.MVXP.SB_USERROOT.apAction['USER_CLOSE'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (10 | ((39) << 16)),
   new MV.MVSB.MAP
   ({
      twUserRootIx                  : MV.MVSB.MAP.FIELD.TWORD8,
      twUserIx                      : MV.MVSB.MAP.FIELD.TWORD8,
   })
);

MV.MVXP.SB_USERROOT.apAction['USER_CONTACT_VALIDATE'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (7 | ((40) << 16)),
   new MV.MVSB.MAP
   ({
      twUserIx                      : MV.MVSB.MAP.FIELD.TWORD8,
      sContact                      : MV.MVSB.MAP.FIELD.STRING (64),
   }),
   new MV.MVSB.MAP
   ({
      twRegionIx                    : MV.MVSB.MAP.FIELD.TWORD8,
      sContact                      : MV.MVSB.MAP.FIELD.STRING (64),
      dwError_Email                 : MV.MVSB.MAP.FIELD.DWORD,
      dwError_SMS                   : MV.MVSB.MAP.FIELD.DWORD,
   }),
);

MV.MVXP.SB_USERROOT.apAction['USER_UNLOCK'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (10 | ((40) << 16)),
   new MV.MVSB.MAP
   ({
      twUserIx                      : MV.MVSB.MAP.FIELD.TWORD8,
      sContact                      : MV.MVSB.MAP.FIELD.STRING (64),
      twSecureDoorIx                : MV.MVSB.MAP.FIELD.TWORD8,
      bResend                       : MV.MVSB.MAP.FIELD.BYTE,
      abReserved_A                  : MV.MVSB.MAP.FIELD.PAD (7),
      sPhrase                       : MV.MVSB.MAP.FIELD.STRING_W (32)
   }),
   MV.MVXP.SB_APPLIC.Map_Token_Out,
   true,
   MV.MVXP.SB_APPLIC.Response_Eval
);

MV.MVXP.SB_USERROOT.apAction['USER_RESET_PASSWORD'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (11 | ((40) << 16)),
   new MV.MVSB.MAP
   ({
      twUserIx                      : MV.MVSB.MAP.FIELD.TWORD8,
      sContact                      : MV.MVSB.MAP.FIELD.STRING (64),
      twSecureDoorIx                : MV.MVSB.MAP.FIELD.TWORD8,
      abReserved_A                  : MV.MVSB.MAP.FIELD.PAD (4),
      dwCode                        : MV.MVSB.MAP.FIELD.DWORD,
      sPassword                     : MV.MVSB.MAP.FIELD.STRING_W (32)
   }),
   MV.MVXP.SB_APPLIC.Map_Token_Out,
   true,
   MV.MVXP.SB_APPLIC.Response_Eval
);

MV.MVXP.SB_USERROOT.apAction['USER_RESET_LOGIN'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (12 | ((40) << 16)),
   new MV.MVSB.MAP
   ({
      twUserIx                      : MV.MVSB.MAP.FIELD.TWORD8,
      sContact                      : MV.MVSB.MAP.FIELD.STRING (64),
      twSecureDoorIx                : MV.MVSB.MAP.FIELD.TWORD8,
      abReserved_A                  : MV.MVSB.MAP.FIELD.PAD (4),
      dwCode                        : MV.MVSB.MAP.FIELD.DWORD,
      sPassword                     : MV.MVSB.MAP.FIELD.STRING_W (32)
   }),
   MV.MVXP.SB_APPLIC.Map_Token_Out,
   true,
   MV.MVXP.SB_APPLIC.Response_Eval
);

MV.MVXP.SB_USER = class extends MV.MVSB.SB_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVSB',
         'User',

         40,

         MV.MVXP.SB_USER.apAction,

         true,

         new MV.MVSB.MAP
         ({
            bPaused           : MV.MVSB.MAP.FIELD.BYTE,
            bGuest            : MV.MVSB.MAP.FIELD.BYTE,
            bTerms            : MV.MVSB.MAP.FIELD.BYTE,
            bFlags            : MV.MVSB.MAP.FIELD.BYTE,
            pBirthDate        : MV.MVXP.Class.USER_BIRTHDATE.MAP,
            sContact          : MV.MVSB.MAP.FIELD.STRING (64),

                                wSize_Partial: [MV.MVSB.MAP.FIELD.eTYPE.SIZE, 0, "Partial"],

            abReserved_A      : MV.MVSB.MAP.FIELD.PAD (8),
            dwRights_Public   : MV.MVSB.MAP.FIELD.DWORD,
            dwRights_Admin    : MV.MVSB.MAP.FIELD.DWORD,
            pSecurity         : MV.MVXP.Class.USER_SECURITY.MAP,
            abReserved_E      : MV.MVSB.MAP.FIELD.PAD (24)
         })
      );
   }

}

MV.MVXP.SB_USER.FACTORY = class extends MV.MVSB.SB_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVXP.SB_USER (this.pReference, this.pMap, pClient);
   }
}

MV.MVXP.SB_USER.apAction =
{
   PAUSE:            new MV.MVSB.SERVICE.CLIENT.ACTION
                     (
                        (1 | ((40) << 16)),
                        new MV.MVSB.MAP
                        ({
                           twUserIx                      : MV.MVSB.MAP.FIELD.TWORD8,
                           dwReason                      : MV.MVSB.MAP.FIELD.DWORD,
                           abReserved_A                  : MV.MVSB.MAP.FIELD.PAD (4),
                        })
                     ),

   CONTINUE:         new MV.MVSB.SERVICE.CLIENT.ACTION
                     (
                        (2 | ((40) << 16)),
                        new MV.MVSB.MAP
                        ({
                           twUserIx                      : MV.MVSB.MAP.FIELD.TWORD8,
                        })
                     ),

   TERMS:            new MV.MVSB.SERVICE.CLIENT.ACTION
                     (
                        (6 | ((40) << 16)),
                        new MV.MVSB.MAP
                        ({
                           twUserIx                      : MV.MVSB.MAP.FIELD.TWORD8,
                           bTerms                        : MV.MVSB.MAP.FIELD.BYTE,
                           abReserved_A                  : MV.MVSB.MAP.FIELD.PAD (7),
                        }),
                        new MV.MVSB.MAP
                        ({
                           bTerms                        : MV.MVSB.MAP.FIELD.BYTE,
                        })
                     ),

   CONTACT_VALIDATE: MV.MVXP.SB_USERROOT.apAction['USER_CONTACT_VALIDATE'],

   CONTACT:          new MV.MVSB.SERVICE.CLIENT.ACTION
                     (
                        (8 | ((40) << 16)),
                        new MV.MVSB.MAP
                        ({
                           twUserIx                      : MV.MVSB.MAP.FIELD.TWORD8,
                           sContact                      : MV.MVSB.MAP.FIELD.STRING (64),
                           twSecureDoorIx                : MV.MVSB.MAP.FIELD.TWORD8,
                           abReserved_A                  : MV.MVSB.MAP.FIELD.PAD (4),
                           dwCode                        : MV.MVSB.MAP.FIELD.DWORD,
                        }),
                        MV.MVXP.SB_APPLIC.Map_Token_Out,
                        true,
                        MV.MVXP.SB_APPLIC.Response_Eval
                     ),

   SECURITY:         new MV.MVSB.SERVICE.CLIENT.ACTION
                     (
                        (9 | ((40) << 16)),
                        new MV.MVSB.MAP
                        ({
                           twUserIx                      : MV.MVSB.MAP.FIELD.TWORD8,
                           qwSettings                    : MV.MVSB.MAP.FIELD.QWORD,
                           sPassword                     : MV.MVSB.MAP.FIELD.STRING_W (32),
                           qwPIN                         : MV.MVSB.MAP.FIELD.QWORD,
                           qwRPIN                        : MV.MVSB.MAP.FIELD.QWORD,
                           dwRPIN                        : MV.MVSB.MAP.FIELD.DWORD,
                           abReserved_A                  : MV.MVSB.MAP.FIELD.PAD (4),
                           qwTOTP                        : MV.MVSB.MAP.FIELD.QWORD,
                           qwSMS                         : MV.MVSB.MAP.FIELD.QWORD,
                           twSecureDoorIx                : MV.MVSB.MAP.FIELD.TWORD8,
                           acToken64U                    : MV.MVSB.MAP.FIELD.STRING (64),
                        }),
                        MV.MVXP.SB_APPLIC.Map_Token_Out,
                        true,
                        MV.MVXP.SB_APPLIC.Response_Eval
                     ),

   UNLOCK:           MV.MVXP.SB_USERROOT.apAction['USER_UNLOCK'],

   RESET_PASSWORD:   MV.MVXP.SB_USERROOT.apAction['USER_RESET_PASSWORD'],

   RESET_LOGIN:      MV.MVXP.SB_USERROOT.apAction['USER_RESET_LOGIN'],

   RESET_SECURITY:   new MV.MVSB.SERVICE.CLIENT.ACTION
                     (
                        (13 | ((40) << 16)),
                        new MV.MVSB.MAP
                        ({
                           twUserIx                      : MV.MVSB.MAP.FIELD.TWORD8,
                           sContact                      : MV.MVSB.MAP.FIELD.STRING (64),
                           twSecureDoorIx                : MV.MVSB.MAP.FIELD.TWORD8,
                           abReserved_A                  : MV.MVSB.MAP.FIELD.PAD (4),
                           dwCode                        : MV.MVSB.MAP.FIELD.DWORD,
                           sPassword                     : MV.MVSB.MAP.FIELD.STRING_W (32),
                        }),
                        MV.MVXP.SB_APPLIC.Map_Token_Out,
                        true,
                        MV.MVXP.SB_APPLIC.Response_Eval
                     ),

   BIRTHDATE:        new MV.MVSB.SERVICE.CLIENT.ACTION
                     (
                        (14 | ((40) << 16)),
                        new MV.MVSB.MAP
                        ({
                           twUserIx                      : MV.MVSB.MAP.FIELD.TWORD8,
                           pBirthDate                    : MV.MVXP.Class.USER_BIRTHDATE.MAP,
                        })
                     ),

   RIGHTS:           new MV.MVSB.SERVICE.CLIENT.ACTION
                     (
                        (15 | ((40) << 16)),
                        new MV.MVSB.MAP
                        ({
                           twUserIx                      : MV.MVSB.MAP.FIELD.TWORD8,
                           dwMask_Public                 : MV.MVSB.MAP.FIELD.DWORD,
                           dwRights_Public               : MV.MVSB.MAP.FIELD.DWORD,
                           dwMask_Admin                  : MV.MVSB.MAP.FIELD.DWORD,
                           dwRights_Admin                : MV.MVSB.MAP.FIELD.DWORD,
                        })
                     ),
};

MV.MVXP.SB_USER_SESSION = class extends MV.MVSB.SB_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVSB',
         'User_Session',

         41,

         MV.MVXP.SB_USER_SESSION.apAction,

         false,

         new MV.MVSB.MAP
         ({
            wLoginIz          : MV.MVSB.MAP.FIELD.WORD,
            abReserved_A      : MV.MVSB.MAP.FIELD.PAD (2),
            dwIPAddress_WAN   : MV.MVSB.MAP.FIELD.DWORD,
            abReserved_B      : MV.MVSB.MAP.FIELD.PAD (24),
            qwClientSessionIx : MV.MVSB.MAP.FIELD.QWORD,
            abReserved_C      : MV.MVSB.MAP.FIELD.PAD (16),
            sGeoRegionIx      : MV.MVSB.MAP.FIELD.STRING (2),
            sGeoStateIx       : MV.MVSB.MAP.FIELD.STRING (2),
            bRegion           : MV.MVSB.MAP.FIELD.BYTE,
            abReserved_D      : MV.MVSB.MAP.FIELD.PAD (3),
         })
      );
   }

}

MV.MVXP.SB_USER_SESSION.FACTORY = class extends MV.MVSB.SB_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVXP.SB_USER_SESSION (this.pReference, this.pMap, pClient);
   }
}

MV.MVXP.SB_SESSION_C2A = class extends MV.MVSB.SB_SESSION
{
   static apAction         = {};
   static apAction_Private = {};

   static init ()
   {
      let apAction = MV.MVXP.SB_SESSION_C2A.apAction;

      apAction['NULL']   = new MV.MVSB.SERVICE.CLIENT.ACTION
                           (
                              (1 | ((1) << 16)),
                              new MV.MVSB.MAP
                              ({
                              })
                           );

      apAction = MV.MVXP.SB_SESSION_C2A.apAction_Private;

      apAction['LOGIN']  = new MV.MVSB.SERVICE.CLIENT.ACTION
                           (
                              (3 | ((40) << 16)),
                              new MV.MVSB.MAP
                              ({
                                 twUserIx                    : MV.MVSB.MAP.FIELD.TWORD8,
                                 sContact                    : MV.MVSB.MAP.FIELD.STRING (64),
                                 twSecureDoorIx              : MV.MVSB.MAP.FIELD.TWORD8,
                                 bRemember                   : MV.MVSB.MAP.FIELD.BYTE,
                                 abReserved_A                : MV.MVSB.MAP.FIELD.PAD (7),
                                 sPassword                   : MV.MVSB.MAP.FIELD.STRING_W (32),
                                 acToken64U_Login            : MV.MVSB.MAP.FIELD.STRING (64),
                                 acToken64U_Session          : MV.MVSB.MAP.FIELD.STRING (64),
                              }),
                              new MV.MVSB.MAP
                              ({
                                 twSecureDoorTypeIx          : MV.MVSB.MAP.FIELD.TWORD8,
                                 twSecureLockTypeIx          : MV.MVSB.MAP.FIELD.TWORD8,
                                 twSecureDoorIx              : MV.MVSB.MAP.FIELD.TWORD8,
                                 twObjectIx                  : MV.MVSB.MAP.FIELD.TWORD8,
                                 tmAcquire                   : MV.MVSB.MAP.FIELD.TIME,
                                 tmExpire                    : MV.MVSB.MAP.FIELD.TIME,
                                 bLimit_Set                  : MV.MVSB.MAP.FIELD.BYTE,
                                 bCount_Set                  : MV.MVSB.MAP.FIELD.BYTE,
                                 bLimit_Unlock               : MV.MVSB.MAP.FIELD.BYTE,
                                 bCount_Unlock               : MV.MVSB.MAP.FIELD.BYTE,
                                 dwResult                    : MV.MVSB.MAP.FIELD.DWORD,
                                 acToken64U                  : MV.MVSB.MAP.FIELD.STRING (64),
                              })
                           );

      apAction['LOGOUT'] = new MV.MVSB.SERVICE.CLIENT.ACTION
                           (
                              (4 | ((40) << 16)),
                              new MV.MVSB.MAP
                              ({
                                 twUserIx                      : MV.MVSB.MAP.FIELD.TWORD8,
                                 abReserved_A                  : MV.MVSB.MAP.FIELD.PAD (8),
                              })
                           );
   }

   static factory ()
   {
      return new this.FACTORY ('MVSB', 'Session_C2a', MV.MVXP.SB_SESSION_C2A.apAction);
   }

   #tInterval;
   #pZone;
   #pParams;
   #bPublic;

   pAction = new MV.MVSB.SERVICE.CLIENT.ACTION
   (
      (8 | ((1) << 16)),
      null,
      null,
      false,
      null,
      false
   );

   constructor (pReference, pClient)
   {
      super (pReference, pClient);

      this.#tInterval = null;
      this.#bPublic   = false;

      this.#pZone = MV.MVMF.Core.Zone (this.pClient.pService.sNamespace);

      this.pClient.Recv_Register (this.pAction, this);

      this.pClient.SetDevice (this.#pZone.Get ('Device'));
   }

   destructor (pClient)
   {
      this.#Stop ();

      this.pClient.Recv_Unregister (this.pAction);

      this.#pZone.destructor ();

      return super.destructor ();
   }

   onRecv_Request (pIAction, wSize, ByteStream)
   {

      this.LoggedOut ();

      return false;
   }

   #Request (sAction)
   {
      return this.pClient.Request (MV.MVXP.SB_SESSION_C2A.apAction_Private[sAction]);
   }

   #Attempt (nReadyState)
   {

      this.pModel.dwResult = 0;

      this.pModel.ReadyState (nReadyState);

      let bResult = this.pClient.Login (this.#pParams);

      return bResult;
   }

   #Failure (dwResult)
   {

      this.#pZone.Remove ('Session');

      this.pModel.dwResult = dwResult;

      this.pModel.ReadyState (this.pModel.eSTATE.LOGGEDOUT);
   }

   #Secure (pSecure)
   {

      if (pSecure.twSecureDoorTypeIx == 6)
      {
         this.pSecure = pSecure;

         let sLog = 'LOGIN_RESULT [C2a/Login]: ';

         if (this.pSecure.dwResult == 0)
         {
            if (this.pSecure.twSecureLockTypeIx == 0x0000FFFFFFFFFFFF)
            {
               this.#pParams.twUserIx         = this.pSecure.twObjectIx;
               this.#pParams.acToken64U_Login = this.#pZone.Get ('Login_' + this.pSecure.twObjectIx);

               if (this.#pParams.acToken64U_Login != null  ||  this.#pParams.twSecureDoorIx == 0x0000FFFFFFFFFFFF)
               {
                  MV.MVSB.Log (sLog + 'SEND TOKEN');

                  if (this.#pParams.acToken64U_Login == null)
                     this.#pParams.acToken64U_Login = 'X';

                  setTimeout (this.#Attempt.bind (this, this.pModel.eSTATE.LOGGINGIN_OLDTOKEN), 0);
               }
               else
               {
                  MV.MVSB.Log (sLog + 'NO TOKEN');

                  this.#Failure (this.pSecure.dwResult);
               }
            }
            else if (this.pSecure.twSecureLockTypeIx != 0)
            {
               MV.MVSB.Log (sLog + 'AUTHENTICATE');

               this.#pZone.Remove ('Login_' + this.pSecure.twObjectIx);

               this.pModel.ReadyState (this.pModel.eSTATE.LOGGINGIN_AUTHENTICATE);
            }
            else
            {
               MV.MVSB.Log (sLog + 'RECV TOKEN');

               this.#pParams.twSecureDoorIx   = 0x0000FFFFFFFFFFFF;
               this.#pParams.twUserIx         = this.pSecure.twObjectIx;
               this.#pParams.acToken64U_Login = this.pSecure.acToken64U;

               let i, aLogin = this.#pZone.Get ('Login');

               if (!aLogin)
               {


let i, asCookie = document.cookie.split (';');
for (i=0; i<asCookie.length; i++)
{
   let sCookie = asCookie[i].split ('=')[0].split ('__')[1];
   if (sCookie  &&  sCookie.indexOf ('Login_') == 0)
      this.#pZone.Remove (sCookie);
}

                  aLogin = [];
               }
               else aLogin = JSON.parse (aLogin);

               for (i=0; i<aLogin.length && aLogin[i]!=this.pSecure.twObjectIx; i++);
               if (i == aLogin.length)
               {
                  while (aLogin.length > 9)
                  {
                     this.#pZone.Remove ('Login_' + aLogin[9]);
                     aLogin.splice (9, 1);
                  }
               }
               else aLogin.splice (i, 1);

               aLogin.splice (0, 0, this.pSecure.twObjectIx);

               this.#pZone.Set ('Login', JSON.stringify (aLogin), true);

               this.#pZone.Set ('Login_' + this.pSecure.twObjectIx, this.#pParams.acToken64U_Login, this.#bPublic ? false : true);

               setTimeout (this.#Attempt.bind (this, this.pModel.eSTATE.LOGGINGIN_NEWTOKEN), 0);
            }
         }
         else
         {
            MV.MVSB.Log (sLog + pSecure.dwResult);

         }
      }

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
         case this.pClient.ePROGRESS.SOCKETCONNECT_RESULT:
            if (pProgress.bResult != false)
            {
               this.pModel.ReadyState (this.pModel.eSTATE.CONNECTED);
            }
            break;

         case this.pClient.ePROGRESS.SOCKETDISCONNECT_RESULT:
            if (pProgress.bResult != false)
            {
               this.pModel.ReadyState (this.pModel.eSTATE.DISCONNECTED);
            }
            break;

         case this.pClient.ePROGRESS.SYSTEMCONNECT_RESULT:
            if (pProgress.bResult != false)
            {
               this.#pZone.Set ('Device', pProgress.acToken64U_Device, true);

               this.pModel.dwResult = 0;

               this.pModel.ReadyState (this.pModel.eSTATE.LOGGEDOUT);

               this.#Start ();
            }
            break;

         case this.pClient.ePROGRESS.SYSTEMDISCONNECT_RESULT:
            if (pProgress.bResult != false)
            {
               this.#Stop ();

               this.pModel.ReadyState (this.pModel.eSTATE.CONNECTED);
            }
            break;

         case this.pClient.ePROGRESS.LOGIN_RESULT:
            if (pProgress.dwResult == 0)
            {
               let pSecure = pProgress.pLogin.pSecure;

               let sLog = 'LOGIN_RESULT [C2a/Session]: ';

               if (pSecure.twSecureDoorTypeIx == 6)
               {
                  this.#Secure (pSecure);
               }
               else
               {
                  if (pSecure.twSecureDoorTypeIx == 7)
                  {
                     if (pSecure.dwResult == 0)
                     {
                        console.log (sLog + pSecure.dwResult);

                        if (pProgress.bVoluntary != false)
                        {
                           this.#pZone.Set ('Session', pProgress.pLogin.acToken64U_Session, (pProgress.pLogin.tmExpire > pProgress.pLogin.tmServer + (0x00546000 * 7)));
                        }

                        this.#Success ();

                        this.#Stop ();
                     }

                     else
                     {
                        console.log (sLog + pSecure.dwResult);

                        this.#Failure (pSecure.dwResult);
                     }
                  }
                  else
                  {
                     console.log (sLog + pSecure.dwResult);

                     this.#Failure (pSecure.dwResult);
                  }
               }
            }
            else this.#Failure (pProgress.dwResult);

            break;

         case this.pClient.ePROGRESS.LOGOUT_RESULT:
            if (pProgress.bResult != false)
            {
               if (pProgress.bVoluntary != false)
               {
                  this.#pZone.Remove ('Session');
               }

               this.pModel.dwResult = 0;

               this.pModel.ReadyState (this.pModel.eSTATE.LOGGEDOUT);

               this.#Start ();
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

         pRequest.twUserIx           = pParams.twUserIx;
         pRequest.dwReserved         = 0;
         pRequest.sContact           = pParams.sContact;
         pRequest.twSecureDoorIx     = pParams.twSecureDoorIx;
         pRequest.bRemember          = pParams.bRemember;
         pRequest.sPassword          = pParams.sPassword;
         pRequest.acToken64U_Login   = pParams.acToken64U_Login;
         pRequest.acToken64U_Session = pParams.acToken64U_Session;
      }
      else if (pLogin)
      {
         pIAction = this.#Request ('LOGIN');
         pRequest = pIAction.pRequest;

         pRequest.twUserIx           = 0;
         pRequest.dwReserved         = 0;
         pRequest.sContact           = '';
         pRequest.twSecureDoorIx     = 0x0000FFFFFFFFFFFD;
         pRequest.bRemember          = 0;
         pRequest.sPassword          = '';
         pRequest.acToken64U_Login   = pLogin.acToken64U_Login;
         pRequest.acToken64U_Session = pLogin.acToken64U_Session;
      }

      return pIAction;
   }

   Login_Response (pParams, pLogin, pIAction, bVoluntary)
   {
      let bResult = false;

      let pResponse = pIAction.pResponse;

      if (pResponse.dwResult == 0  &&  pResponse.twSecureDoorTypeIx == 7  &&  pResponse.twSecureLockTypeIx == 0)
      {
         pLogin.twUserIx           = pResponse.twObjectIx;
         pLogin.twSessionIz        = pResponse.tmAcquire;
         pLogin.acToken64U_Session = pResponse.acToken64U;
         pLogin.tmExpire           = pResponse.tmExpire;
         pLogin.tmServer           = this.pClient.Time_Server ();

         if (pParams)
            pLogin.acToken64U_Login = pParams.acToken64U_Login;

         bResult = true;
      }

      pLogin.pSecure = pResponse;

      return bResult;
   }

   Logout_Request (pParams, pLogin)
   {
      let pIAction = this.#Request ('LOGOUT');
      let pRequest = pIAction.pRequest;

      pRequest.twUserIx = pLogin.twUserIx;

      return pIAction;
   }

   Logout_Response (pParams, pLogin, pIAction, bVoluntary, bDisconnected)
   {
      let bResult = false;

   }

   #Start ()
   {
      if (this.#tInterval == null)
      {
         this.#tInterval = setInterval (this.#Interval.bind (this), 500);

         setTimeout (this.#Interval.bind (this), 0);
      }
   }

   #Stop ()
   {
      if (this.#tInterval != null)
      {
         clearInterval (this.#tInterval);

         this.#tInterval = null;
      }
   }

   #Interval ()
   {
      let acToken64U_Session = this.#pZone.Get ('Session');

      if (acToken64U_Session != null)
      {
         this.#Relogin (acToken64U_Session);
      }
   }

   #Relogin (acToken64U_Session)
   {
      let bResult = false;

      if (this.pModel.ReadyState () == this.pModel.eSTATE.LOGGEDOUT)
      {
         this.#pParams =
         {
            twUserIx           : 0,
            sContact           : '',
            sPassword          : '',
            bRemember          : 0,
            acToken64U_Login   : '',
            acToken64U_Session : acToken64U_Session,
            twSecureDoorIx     : 0x0000FFFFFFFFFFFD
         };

         bResult = this.#Attempt (this.pModel.eSTATE.LOGGINGIN_OLDTOKEN);
      }

      return bResult;
   }

   IsLoggedOut ()
   {
      return (super.IsLoggedOut ()  &&  this.#pZone.Get ('Session') == null);
   };

   Login (sContact, sPassword, bRemember)
   {
      let bResult = false;

      if (this.pModel.ReadyState () == this.pModel.eSTATE.LOGGEDOUT)
      {
         this.#pParams =
         {
            twUserIx           : 0,
            sContact           : sContact,
            sPassword          : sPassword,
            bRemember          : bRemember ? 1 : 0,
            acToken64U_Login   : '',
            acToken64U_Session : '',
            twSecureDoorIx     : 0x0000FFFFFFFFFFFF
         };

         bResult = this.#Attempt (this.pModel.eSTATE.LOGGINGIN_NOTOKEN);
      }

      return bResult;
   }

   Authenticate (bPublic)
   {
      let bResult = false;

      if (this.pModel.ReadyState () == this.pModel.eSTATE.LOGGINGIN_AUTHENTICATE)
      {
         if (bPublic == undefined)
         {
            this.pModel.dwResult = 0;

            this.pModel.ReadyState (this.pModel.eSTATE.LOGGEDOUT);

            bResult = true;
         }
         else
         {
            this.#bPublic = bPublic;

            this.#pParams.acToken64U_Login = '';
            this.#pParams.twSecureDoorIx   = this.pSecure.twSecureDoorIx;

            bResult = this.#Attempt (this.pModel.eSTATE.LOGGINGIN_AUTHENTICATE);
         }
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
}

MV.MVXP.SB_SESSION_C2A.FACTORY = class extends MV.MVSB.SB_SESSION.FACTORY
{

   Create (pClient)
   {
      return new MV.MVXP.SB_SESSION_C2A (this.pReference, pClient);
   }
}

MV.MVXP.SB_SESSION_C2A.IRECV = class extends MV.MVSB.SERVICE.CLIENT.IRECV
{
   constructor (pSession)
   {
      this.pSession = pSession;
   }

   onRecv_Request (pIAction, wSize, ByteStream)
   {
      return this.pSession.onRecv_Request (pIAction, wSize, ByteStream);
   }
}

MV.MVXP.APPLIC = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('Applic');
   }

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twApplicIx = pReference.twObjectIx;
   }

   Request (sAction)
   {
      let pIAction = super.Request (sAction);
      if (pIAction)
      {
         let pRequest = pIAction.pRequest;

         if ('twApplicIx' in pRequest)
            pRequest.twApplicIx = this.twApplicIx;
         if ('twUserIx' in pRequest)
            pRequest.twUserIx = this.twUserIx;
      }

      return pIAction;
   }
}

MV.MVXP.APPLIC.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twApplicIx = Number (asArgs[0]);

      return new MV.MVXP.APPLIC.IREFERENCE (this.sID, twApplicIx);
   }
}

MV.MVXP.APPLIC.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVXP.APPLIC (this, pSource);
   }
}

MV.MVXP.REGIONROOT = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('RegionRoot');
   }

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twRegionRootIx = pReference.twObjectIx;
   }

   Request (sAction)
   {
      let pIAction = super.Request (sAction);
      if (pIAction)
      {
         let pRequest = pIAction.pRequest;

         if ('twRegionRootIx' in pRequest)
            pRequest.twRegionRootIx = this.twRegionRootIx;
      }

      return pIAction;
   }

   Help ()
   {
      console.log ('Root >\n\tHelp () to see these options\n\tList () to see a list of countries\n\tCountry (\'XX\') to select a country');
   }

   Log ()
   {
      this.Help ();
   }

   List ()
   {
      let Format = function (pRegion)
      {
         pRegion.Log ();

         return true;
      }

      this.Child_Enum ('Region', this, Format);
   }

   Find (sISO2)
   {
      let pRegion = null;

      let cpChild = this.acpChild['Region'];

      if ((pRegion = cpChild.Get (MV.MVXP.REGION.Index (sISO2))) != null)
      {
         cpChild.Release ();
      }

      return pRegion;
   }
}

MV.MVXP.REGIONROOT.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRegionRootIx = Number (asArgs[0]);

      return new MV.MVXP.REGIONROOT.IREFERENCE (this.sID, twRegionRootIx);
   }
}

MV.MVXP.REGIONROOT.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVXP.REGIONROOT (this, pSource);
   }
}

MV.MVXP.REGION = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('Region');
   }

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twRegionIx = pReference.twObjectIx;
   }

   static Index (sISO2)
   {
      return (sISO2.charCodeAt (1) << 8) + sISO2.charCodeAt (0);
   }

   static Code (twRegionIx)
   {
      let sISO2 = null;

      twRegionIx -= 0x4141;

      if (((twRegionIx >> 8) & 0xFF) < 26  &&  (twRegionIx & 0xFF) < 26)
         sISO2 = String.fromCharCode ((twRegionIx & 0xFF) + 0x41, ((twRegionIx >> 8) & 0xFF) + 0x41);

      return sISO2;
   }

   get sISO2 () { return MV.MVXP.REGION.Code (this.twRegionIx); }

   Request (sAction)
   {
      let pIAction = super.Request (sAction);
      if (pIAction)
      {
         let pRequest = pIAction.pRequest;

         if ('twRegionIx' in pRequest)
            pRequest.twRegionIx = this.twRegionIx;
      }

      return pIAction;
   }

   Help ()
   {
      console.log ('Country >\n\tHelp () to see these options\n\tRoot () to return to the root\n\tPause () to pause this country\n\tContinue () to continue this country\n\tUpdate (twSMSFormatIx, sFormat) to update a format\n\tList () to see a list of formats');
   }

   Log ()
   {
      let sISO2 = this.sISO2;

      console.log (this.twRegionIx + ' (' + sISO2 + ') > CC=' + this.wCountryCode + ' [' + MV.MVXP.Geo.apRegion[sISO2].sName + ']' + (this.bPaused ? ' (paused)' : ''));
   }

   List ()
   {
      let Format = function (pRegion_SMSFormat)
      {
         pRegion_SMSFormat.Log ();

         return true;
      }

      this.Child_Enum ('Region_SMSFormat', this, Format);
   }

   Pause (pThis, fnResponse, pParam)
   {
      this.Send ('PAUSE', {}, pThis, fnResponse, pParam);
   }

   Continue (pThis, fnResponse, pParam)
   {
      this.Send ('CONTINUE', {}, pThis, fnResponse, pParam);
   }

   Update (twSMSFormatIx, sFormat, pThis, fnResponse, pParam)
   {
      this.Send ('FORMAT_UPDATE', { twSMSFormatIx, sFormat }, pThis, fnResponse, pParam);
   }
}

MV.MVXP.REGION.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRegionIx = Number (asArgs[0]);

      if (isNaN (twRegionIx))
         twRegionIx = MV.MVXP.REGION.Index (asArgs[0]);

      return new MV.MVXP.REGION.IREFERENCE (this.sID, twRegionIx);
   }
}

MV.MVXP.REGION.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVXP.REGION (this, pSource);
   }
}

MV.MVXP.REGION_SMSPREFIX = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('Region_SMSPrefix');
   }

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twRegionIx = pReference.twObjectIx;
      this.twSMSPrefixIx     = pReference.twChildIx;
   }
}

MV.MVXP.REGION_SMSPREFIX.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRegionIx = Number (asArgs[0]);
      let twSMSPrefixIx     = Number (asArgs[1]);

      if (isNaN (twRegionIx))
         twRegionIx = MV.MVXP.REGION.Index (asArgs[0]);

      return new MV.MVXP.REGION_SMSPREFIX.IREFERENCE (this.sID, twRegionIx, twSMSPrefixIx);
   }
}

MV.MVXP.REGION_SMSPREFIX.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVXP.REGION_SMSPREFIX (this, pSource);
   }
}

MV.MVXP.REGION_SMSFORMAT = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('Region_SMSFormat');
   }

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twRegionIx = pReference.twObjectIx;
      this.twSMSFormatIx     = pReference.twChildIx;
   }

   Log ()
   {
      console.log (this.twSMSFormatIx + ' > ' + this.sFormat);
   }
}

MV.MVXP.REGION_SMSFORMAT.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRegionIx = Number (asArgs[0]);
      let twSMSFormatIx     = Number (asArgs[1]);

      if (isNaN (twRegionIx))
         twRegionIx = MV.MVXP.REGION.Index (asArgs[0]);

      return new MV.MVXP.REGION_SMSFORMAT.IREFERENCE (this.sID, twRegionIx, twSMSFormatIx);
   }
}

MV.MVXP.REGION_SMSFORMAT.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVXP.REGION_SMSFORMAT (this, pSource);
   }
}

MV.MVXP.USERROOT = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('UserRoot');
   }

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twUserRootIx = pReference.twObjectIx;
   }

   Request (sAction)
   {
      let pIAction = super.Request (sAction);
      if (pIAction)
      {
         let pRequest = pIAction.pRequest;

         if ('twUserRootIx' in pRequest)
            pRequest.twUserRootIx = this.twUserRootIx;
      }

      return pIAction;
   }
}

MV.MVXP.USERROOT.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twUserRootIx = Number (asArgs[0]);

      return new MV.MVXP.USERROOT.IREFERENCE (this.sID, twUserRootIx);
   }
}

MV.MVXP.USERROOT.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVXP.USERROOT (this, pSource);
   }
}

MV.MVXP.USER = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('User');
   }

   static eACTION =
   {
      DEVICE      : 0,
      EMAIL       : 1,
      SECURITY    : 2,
      PERSONALINFO: 3
   };

   static eMETHOD =
   {
      NONE        : 0,
      PASSWORD    : 1,
      PIN         : 2,
      RPIN        : 3,
      TOTP        : 4,
      NOTIFICATION: 5,
      CONFIRM     : 6
   };

   eACTION = MV.MVXP.USER.eACTION;
   eMETHOD = MV.MVXP.USER.eMETHOD;

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twUserIx = pReference.twObjectIx;

      this.pBirthDate = new MV.MVXP.Class.USER_BIRTHDATE ();
      this.pSecurity  = new MV.MVXP.Class.USER_SECURITY  ();
   }

   destructor ()
   {
      this.pBirthDate = this.pBirthDate.destructor ();
      this.pSecurity  = this.pSecurity .destructor ();

      return super.destructor ();
   }

   Request (sAction)
   {
      let pIAction = super.Request (sAction);
      if (pIAction)
      {
         let pRequest = pIAction.pRequest;

         if ('twUserIx' in pRequest)
            pRequest.twUserIx = this.twUserIx;
      }

      return pIAction;
   }

   GetMethod (nAction)
   {
      return ((((this.pSecurity.qwSettings) >> ((nAction) * 4)) & 0x000000000000000F) >> 1);
   }

   SecuritySetting (nAction, nMethod, bNotify)
   {
      return ((nMethod << 1) + (bNotify ? 1 : 0)) << (nAction * 4);
   }
}

MV.MVXP.USER.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twUserIx = Number (asArgs[0]);

      return new MV.MVXP.USER.IREFERENCE (this.sID, twUserIx);
   }
}

MV.MVXP.USER.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVXP.USER (this, pSource);
   }
}

MV.MVXP.USER_SESSION = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('User_Session');
   }

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twUserIx    = pReference.twObjectIx;
      this.twSessionIz = pReference.twChildIx;
   }
}

MV.MVXP.USER_SESSION.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twUserIx    = Number (asArgs[0]);
      let twSessionIz = Number (asArgs[1]);

      return new MV.MVXP.USER_SESSION.IREFERENCE (this.sID, twUserIx, twSessionIz);
   }
}

MV.MVXP.USER_SESSION.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVXP.USER_SESSION (this, pSource);
   }
}

MV.MVXP.Geo = {};

MV.MVXP.Geo.COUNTRY = class
{
   constructor (sISO2, sISO3, nISO, nFIPS, nCCC, sName)
   {
      this.sISO2  = sISO2;
      this.sISO3  = sISO3;
      this.nISO   = nISO;
      this.nFIPS  = nFIPS;
      this.nCCC   = nCCC;
      this.sName  = sName;
   }
}

MV.MVXP.Geo.TERRITORY = class extends MV.MVXP.Geo.COUNTRY
{
   static eTYPE =
   {
      ZZ : '<null>',
      AR : 'Autonomous Region',
      AT : 'Autonomous Territory',
      CC : 'Constituent Country',
      CD : 'Crown Dependency',
      DT : 'Dependent Territory',
      ET : 'External Territory',
      IA : 'Insular Area',
      OC : 'Overseas Collectivity',
      OR : 'Overseas Department and Region',
      OT : 'Overseas Territory',
      SM : 'Special Municipality',
      SR : 'Special Administrative Region',
      TE : 'Territory',

   };

   eTYPE = MV.MVXP.Geo.TERRITORY.eTYPE;

   constructor (sISO2, sISO3, nISO, nFIPS, nCCC, sName, sOf, sType)
   {
      super (sISO2, sISO3, nISO, nFIPS, nCCC, sName)

      this.pCountry = MV.MVXP.Geo.apCountry[sOf];
      this.sType    = this.eTYPE[sType];
   }
}

MV.MVXP.Geo.STATE = class
{
   static eTYPE =
   {
      ZZ : '<null>',
      ST : 'State',
      PR : 'Province',
   };

   eTYPE = MV.MVXP.Geo.STATE.eTYPE;

   constructor (sISO2, sName, sOf, sType)
   {
      this.sISO2   = sISO2;
      this.sName   = sName;

      this.pRegion = MV.MVXP.Geo.apRegion[sOf];
      this.sType   = this.eTYPE[sType];
   }
}

MV.MVXP.Geo.apCountry =
{

   ZZ : new MV.MVXP.Geo.COUNTRY   ( 'ZZ',      'ZZZ',        0,      'ZZ',        0,      '<null>'                           ),
   AF : new MV.MVXP.Geo.COUNTRY   ( 'AF',      'AFG',        4,      'AF',       93,      'Afghanistan'                      ),
   AL : new MV.MVXP.Geo.COUNTRY   ( 'AL',      'ALB',        8,      'AL',      355,      'Albania'                          ),
   DZ : new MV.MVXP.Geo.COUNTRY   ( 'DZ',      'DZA',       12,      'AG',      213,      'Algeria'                          ),
   AD : new MV.MVXP.Geo.COUNTRY   ( 'AD',      'AND',       20,      'AN',      376,      'Andorra'                          ),
   AO : new MV.MVXP.Geo.COUNTRY   ( 'AO',      'AGO',       24,      'AO',      244,      'Angola'                           ),
   AQ : new MV.MVXP.Geo.COUNTRY   ( 'AQ',      'ATA',       10,      'AY',      672,      'Antarctica'                       ),
   AG : new MV.MVXP.Geo.COUNTRY   ( 'AG',      'ATG',       28,      'AC',        1,      'Antigua and Barbuda'              ),
   AR : new MV.MVXP.Geo.COUNTRY   ( 'AR',      'ARG',       32,      'AR',       54,      'Argentina'                        ),
   AM : new MV.MVXP.Geo.COUNTRY   ( 'AM',      'ARM',       51,      'AM',      374,      'Armenia'                          ),
   AU : new MV.MVXP.Geo.COUNTRY   ( 'AU',      'AUS',       36,      'AS',       61,      'Australia'                        ),
   AT : new MV.MVXP.Geo.COUNTRY   ( 'AT',      'AUT',       40,      'AU',       43,      'Austria'                          ),
   AZ : new MV.MVXP.Geo.COUNTRY   ( 'AZ',      'AZE',       31,      'AJ',      994,      'Azerbaijan'                       ),
   BH : new MV.MVXP.Geo.COUNTRY   ( 'BH',      'BHR',       48,      'BA',      973,      'Bahrain'                          ),
   BD : new MV.MVXP.Geo.COUNTRY   ( 'BD',      'BGD',       50,      'BG',      880,      'Bangladesh'                       ),
   BB : new MV.MVXP.Geo.COUNTRY   ( 'BB',      'BRB',       52,      'BB',        1,      'Barbados'                         ),
   BY : new MV.MVXP.Geo.COUNTRY   ( 'BY',      'BLR',      112,      'BO',      375,      'Belarus'                          ),
   BE : new MV.MVXP.Geo.COUNTRY   ( 'BE',      'BEL',       56,      'BE',       32,      'Belgium'                          ),
   BZ : new MV.MVXP.Geo.COUNTRY   ( 'BZ',      'BLZ',       84,      'BH',      501,      'Belize'                           ),
   BJ : new MV.MVXP.Geo.COUNTRY   ( 'BJ',      'BEN',      204,      'BN',      229,      'Benin'                            ),
   BT : new MV.MVXP.Geo.COUNTRY   ( 'BT',      'BTN',       64,      'BT',      975,      'Bhutan'                           ),
   BO : new MV.MVXP.Geo.COUNTRY   ( 'BO',      'BOL',       68,      'BL',      591,      'Bolivia'                          ),
   BA : new MV.MVXP.Geo.COUNTRY   ( 'BA',      'BIH',       70,      'BK',      387,      'Bosnia and Herzegovina'           ),
   BW : new MV.MVXP.Geo.COUNTRY   ( 'BW',      'BWA',       72,      'BC',      267,      'Botswana'                         ),
   BR : new MV.MVXP.Geo.COUNTRY   ( 'BR',      'BRA',       76,      'BR',       55,      'Brazil'                           ),
   BN : new MV.MVXP.Geo.COUNTRY   ( 'BN',      'BRN',       96,      'BX',      673,      'Brunei'                           ),
   BG : new MV.MVXP.Geo.COUNTRY   ( 'BG',      'BGR',      100,      'BU',      359,      'Bulgaria'                         ),
   BF : new MV.MVXP.Geo.COUNTRY   ( 'BF',      'BFA',      854,      'UV',      226,      'Burkina Faso'                     ),
   BI : new MV.MVXP.Geo.COUNTRY   ( 'BI',      'BDI',      108,      'BY',      257,      'Burundi'                          ),
   KH : new MV.MVXP.Geo.COUNTRY   ( 'KH',      'KHM',      116,      'CB',      855,      'Cambodia'                         ),
   CM : new MV.MVXP.Geo.COUNTRY   ( 'CM',      'CMR',      120,      'CM',      237,      'Cameroon'                         ),
   CA : new MV.MVXP.Geo.COUNTRY   ( 'CA',      'CAN',      124,      'CA',        1,      'Canada'                           ),
   CV : new MV.MVXP.Geo.COUNTRY   ( 'CV',      'CPV',      132,      'CV',      238,      'Cape Verde'                       ),
   CF : new MV.MVXP.Geo.COUNTRY   ( 'CF',      'CAF',      140,      'CT',      236,      'Central African Republic'         ),
   TD : new MV.MVXP.Geo.COUNTRY   ( 'TD',      'TCD',      148,      'CD',      235,      'Chad'                             ),
   CL : new MV.MVXP.Geo.COUNTRY   ( 'CL',      'CHL',      152,      'CI',       56,      'Chile'                            ),
   CN : new MV.MVXP.Geo.COUNTRY   ( 'CN',      'CHN',      156,      'CH',       86,      'China'                            ),
   CO : new MV.MVXP.Geo.COUNTRY   ( 'CO',      'COL',      170,      'CO',       57,      'Colombia'                         ),
   KM : new MV.MVXP.Geo.COUNTRY   ( 'KM',      'COM',      174,      'CN',      269,      'Comoros'                          ),
   CK : new MV.MVXP.Geo.COUNTRY   ( 'CK',      'COK',      184,      'CW',      682,      'Cook Islands'                     ),
   CR : new MV.MVXP.Geo.COUNTRY   ( 'CR',      'CRI',      188,      'CS',      506,      'Costa Rica'                       ),
   HR : new MV.MVXP.Geo.COUNTRY   ( 'HR',      'HRV',      191,      'HR',      385,      'Croatia'                          ),
   CU : new MV.MVXP.Geo.COUNTRY   ( 'CU',      'CUB',      192,      'CU',       53,      'Cuba'                             ),
   CY : new MV.MVXP.Geo.COUNTRY   ( 'CY',      'CYP',      196,      'CY',      357,      'Cyprus'                           ),
   CZ : new MV.MVXP.Geo.COUNTRY   ( 'CZ',      'CZE',      203,      'EZ',      420,      'Czech Republic'                   ),
   CD : new MV.MVXP.Geo.COUNTRY   ( 'CD',      'COD',      180,      'CG',      243,      'Democratic Republic of the Congo' ),
   DK : new MV.MVXP.Geo.COUNTRY   ( 'DK',      'DNK',      208,      'DA',       45,      'Denmark'                          ),
   DJ : new MV.MVXP.Geo.COUNTRY   ( 'DJ',      'DJI',      262,      'DJ',      253,      'Djibouti'                         ),
   DM : new MV.MVXP.Geo.COUNTRY   ( 'DM',      'DMA',      212,      'DO',        1,      'Dominica'                         ),
   DO : new MV.MVXP.Geo.COUNTRY   ( 'DO',      'DOM',      214,      'DR',        1,      'Dominican Republic'               ),
   TL : new MV.MVXP.Geo.COUNTRY   ( 'TL',      'TLS',      626,      'TT',      670,      'East Timor'                       ),
   EC : new MV.MVXP.Geo.COUNTRY   ( 'EC',      'ECU',      218,      'EC',      593,      'Ecuador'                          ),
   EG : new MV.MVXP.Geo.COUNTRY   ( 'EG',      'EGY',      818,      'EG',       20,      'Egypt'                            ),
   SV : new MV.MVXP.Geo.COUNTRY   ( 'SV',      'SLV',      222,      'ES',      503,      'El Salvador'                      ),
   GQ : new MV.MVXP.Geo.COUNTRY   ( 'GQ',      'GNQ',      226,      'EK',      240,      'Equatorial Guinea'                ),
   ER : new MV.MVXP.Geo.COUNTRY   ( 'ER',      'ERI',      232,      'ER',      291,      'Eritrea'                          ),
   EE : new MV.MVXP.Geo.COUNTRY   ( 'EE',      'EST',      233,      'EN',      372,      'Estonia'                          ),
   SZ : new MV.MVXP.Geo.COUNTRY   ( 'SZ',      'SWZ',      748,      'WZ',      268,      'Eswatini'                         ),
   ET : new MV.MVXP.Geo.COUNTRY   ( 'ET',      'ETH',      231,      'ET',      251,      'Ethiopia'                         ),
   FM : new MV.MVXP.Geo.COUNTRY   ( 'FM',      'FSM',      583,      'FM',      691,      'Federated States of Micronesia'   ),
   FJ : new MV.MVXP.Geo.COUNTRY   ( 'FJ',      'FJI',      242,      'FJ',      679,      'Fiji'                             ),
   FI : new MV.MVXP.Geo.COUNTRY   ( 'FI',      'FIN',      246,      'FI',      358,      'Finland'                          ),
   FR : new MV.MVXP.Geo.COUNTRY   ( 'FR',      'FRA',      250,      'FR',       33,      'France'                           ),
   GA : new MV.MVXP.Geo.COUNTRY   ( 'GA',      'GAB',      266,      'GB',      241,      'Gabon'                            ),
   GE : new MV.MVXP.Geo.COUNTRY   ( 'GE',      'GEO',      268,      'GG',      995,      'Georgia'                          ),
   DE : new MV.MVXP.Geo.COUNTRY   ( 'DE',      'DEU',      276,      'GM',       49,      'Germany'                          ),
   GH : new MV.MVXP.Geo.COUNTRY   ( 'GH',      'GHA',      288,      'GH',      233,      'Ghana'                            ),
   GR : new MV.MVXP.Geo.COUNTRY   ( 'GR',      'GRC',      300,      'GR',       30,      'Greece'                           ),
   GD : new MV.MVXP.Geo.COUNTRY   ( 'GD',      'GRD',      308,      'GJ',        1,      'Grenada'                          ),
   GT : new MV.MVXP.Geo.COUNTRY   ( 'GT',      'GTM',      320,      'GT',      502,      'Guatemala'                        ),
   GN : new MV.MVXP.Geo.COUNTRY   ( 'GN',      'GIN',      324,      'GV',      224,      'Guinea'                           ),
   GW : new MV.MVXP.Geo.COUNTRY   ( 'GW',      'GNB',      624,      'PU',      245,      'Guinea-Bissau'                    ),
   GY : new MV.MVXP.Geo.COUNTRY   ( 'GY',      'GUY',      328,      'GY',      592,      'Guyana'                           ),
   HT : new MV.MVXP.Geo.COUNTRY   ( 'HT',      'HTI',      332,      'HA',      509,      'Haiti'                            ),
   HN : new MV.MVXP.Geo.COUNTRY   ( 'HN',      'HND',      340,      'HO',      504,      'Honduras'                         ),
   HU : new MV.MVXP.Geo.COUNTRY   ( 'HU',      'HUN',      348,      'HU',       36,      'Hungary'                          ),
   IS : new MV.MVXP.Geo.COUNTRY   ( 'IS',      'ISL',      352,      'IC',      354,      'Iceland'                          ),
   IN : new MV.MVXP.Geo.COUNTRY   ( 'IN',      'IND',      356,      'IN',       91,      'India'                            ),
   ID : new MV.MVXP.Geo.COUNTRY   ( 'ID',      'IDN',      360,      'ID',       62,      'Indonesia'                        ),
   IR : new MV.MVXP.Geo.COUNTRY   ( 'IR',      'IRN',      364,      'IR',       98,      'Iran'                             ),
   IQ : new MV.MVXP.Geo.COUNTRY   ( 'IQ',      'IRQ',      368,      'IZ',      964,      'Iraq'                             ),
   IE : new MV.MVXP.Geo.COUNTRY   ( 'IE',      'IRL',      372,      'EI',      353,      'Ireland'                          ),
   IL : new MV.MVXP.Geo.COUNTRY   ( 'IL',      'ISR',      376,      'IS',      972,      'Israel'                           ),
   IT : new MV.MVXP.Geo.COUNTRY   ( 'IT',      'ITA',      380,      'IT',       39,      'Italy'                            ),
   CI : new MV.MVXP.Geo.COUNTRY   ( 'CI',      'CIV',      384,      'IV',      225,      'Ivory Coast'                      ),
   JM : new MV.MVXP.Geo.COUNTRY   ( 'JM',      'JAM',      388,      'JM',        1,      'Jamaica'                          ),
   JP : new MV.MVXP.Geo.COUNTRY   ( 'JP',      'JPN',      392,      'JA',       81,      'Japan'                            ),
   JO : new MV.MVXP.Geo.COUNTRY   ( 'JO',      'JOR',      400,      'JO',      962,      'Jordan'                           ),
   KZ : new MV.MVXP.Geo.COUNTRY   ( 'KZ',      'KAZ',      398,      'KZ',        7,      'Kazakhstan'                       ),
   KE : new MV.MVXP.Geo.COUNTRY   ( 'KE',      'KEN',      404,      'KE',      254,      'Kenya'                            ),
   KI : new MV.MVXP.Geo.COUNTRY   ( 'KI',      'KIR',      296,      'KR',      686,      'Kiribati'                         ),
   KO : new MV.MVXP.Geo.COUNTRY   ( 'KO',      'KOS',      990,      'KV',      383,      'Kosovo'                           ),
   KW : new MV.MVXP.Geo.COUNTRY   ( 'KW',      'KWT',      414,      'KU',      965,      'Kuwait'                           ),
   KG : new MV.MVXP.Geo.COUNTRY   ( 'KG',      'KGZ',      417,      'KG',      996,      'Kyrgyzstan'                       ),
   LA : new MV.MVXP.Geo.COUNTRY   ( 'LA',      'LAO',      418,      'LA',      856,      'Laos'                             ),
   LV : new MV.MVXP.Geo.COUNTRY   ( 'LV',      'LVA',      428,      'LG',      371,      'Latvia'                           ),
   LB : new MV.MVXP.Geo.COUNTRY   ( 'LB',      'LBN',      422,      'LE',      961,      'Lebanon'                          ),
   LS : new MV.MVXP.Geo.COUNTRY   ( 'LS',      'LSO',      426,      'LT',      266,      'Lesotho'                          ),
   LR : new MV.MVXP.Geo.COUNTRY   ( 'LR',      'LBR',      430,      'LI',      231,      'Liberia'                          ),
   LY : new MV.MVXP.Geo.COUNTRY   ( 'LY',      'LBY',      434,      'LY',      218,      'Libya'                            ),
   LI : new MV.MVXP.Geo.COUNTRY   ( 'LI',      'LIE',      438,      'LS',      423,      'Liechtenstein'                    ),
   LT : new MV.MVXP.Geo.COUNTRY   ( 'LT',      'LTU',      440,      'LH',      370,      'Lithuania'                        ),
   LU : new MV.MVXP.Geo.COUNTRY   ( 'LU',      'LUX',      442,      'LU',      352,      'Luxembourg'                       ),
   MG : new MV.MVXP.Geo.COUNTRY   ( 'MG',      'MDG',      450,      'MA',      261,      'Madagascar'                       ),
   MW : new MV.MVXP.Geo.COUNTRY   ( 'MW',      'MWI',      454,      'MI',      265,      'Malawi'                           ),
   MY : new MV.MVXP.Geo.COUNTRY   ( 'MY',      'MYS',      458,      'MY',       60,      'Malaysia'                         ),
   MV : new MV.MVXP.Geo.COUNTRY   ( 'MV',      'MDV',      462,      'MV',      960,      'Maldives'                         ),
   ML : new MV.MVXP.Geo.COUNTRY   ( 'ML',      'MLI',      466,      'ML',      223,      'Mali'                             ),
   MT : new MV.MVXP.Geo.COUNTRY   ( 'MT',      'MLT',      470,      'MT',      356,      'Malta'                            ),
   MH : new MV.MVXP.Geo.COUNTRY   ( 'MH',      'MHL',      584,      'RM',      692,      'Marshall Islands'                 ),
   MR : new MV.MVXP.Geo.COUNTRY   ( 'MR',      'MRT',      478,      'MR',      222,      'Mauritania'                       ),
   MU : new MV.MVXP.Geo.COUNTRY   ( 'MU',      'MUS',      480,      'MP',      230,      'Mauritius'                        ),
   MX : new MV.MVXP.Geo.COUNTRY   ( 'MX',      'MEX',      484,      'MX',       52,      'Mexico'                           ),
   MD : new MV.MVXP.Geo.COUNTRY   ( 'MD',      'MDA',      498,      'MD',      373,      'Moldova'                          ),
   MC : new MV.MVXP.Geo.COUNTRY   ( 'MC',      'MCO',      492,      'MN',      377,      'Monaco'                           ),
   MN : new MV.MVXP.Geo.COUNTRY   ( 'MN',      'MNG',      496,      'MG',      976,      'Mongolia'                         ),
   ME : new MV.MVXP.Geo.COUNTRY   ( 'ME',      'MNE',      499,      'MJ',      382,      'Montenegro'                       ),
   MA : new MV.MVXP.Geo.COUNTRY   ( 'MA',      'MAR',      504,      'MO',      212,      'Morocco'                          ),
   MZ : new MV.MVXP.Geo.COUNTRY   ( 'MZ',      'MOZ',      508,      'MZ',      258,      'Mozambique'                       ),
   MM : new MV.MVXP.Geo.COUNTRY   ( 'MM',      'MMR',      104,      'BM',       95,      'Myanmar'                          ),
   NA : new MV.MVXP.Geo.COUNTRY   ( 'NA',      'NAM',      516,      'WA',      264,      'Namibia'                          ),
   NR : new MV.MVXP.Geo.COUNTRY   ( 'NR',      'NRU',      520,      'NR',      674,      'Nauru'                            ),
   NP : new MV.MVXP.Geo.COUNTRY   ( 'NP',      'NPL',      524,      'NP',      977,      'Nepal'                            ),
   NL : new MV.MVXP.Geo.COUNTRY   ( 'NL',      'NLD',      528,      'NL',       31,      'Netherlands'                      ),
   NZ : new MV.MVXP.Geo.COUNTRY   ( 'NZ',      'NZL',      554,      'NZ',       64,      'New Zealand'                      ),
   NI : new MV.MVXP.Geo.COUNTRY   ( 'NI',      'NIC',      558,      'NU',      505,      'Nicaragua'                        ),
   NE : new MV.MVXP.Geo.COUNTRY   ( 'NE',      'NER',      562,      'NG',      227,      'Niger'                            ),
   NG : new MV.MVXP.Geo.COUNTRY   ( 'NG',      'NGA',      566,      'NI',      234,      'Nigeria'                          ),
   NU : new MV.MVXP.Geo.COUNTRY   ( 'NU',      'NIU',      570,      'NE',      683,      'Niue'                             ),
   KP : new MV.MVXP.Geo.COUNTRY   ( 'KP',      'PRK',      408,      'KN',      850,      'North Korea'                      ),
   MK : new MV.MVXP.Geo.COUNTRY   ( 'MK',      'MKD',      807,      'MK',      389,      'North Macedonia'                  ),
   NO : new MV.MVXP.Geo.COUNTRY   ( 'NO',      'NOR',      578,      'NO',       47,      'Norway'                           ),
   OM : new MV.MVXP.Geo.COUNTRY   ( 'OM',      'OMN',      512,      'MU',      968,      'Oman'                             ),
   PK : new MV.MVXP.Geo.COUNTRY   ( 'PK',      'PAK',      586,      'PK',       92,      'Pakistan'                         ),
   PW : new MV.MVXP.Geo.COUNTRY   ( 'PW',      'PLW',      585,      'PS',      680,      'Palau'                            ),
   PS : new MV.MVXP.Geo.COUNTRY   ( 'PS',      'PSE',      275,      'WE',      970,      'Palestine'                        ),
   PA : new MV.MVXP.Geo.COUNTRY   ( 'PA',      'PAN',      591,      'PM',      507,      'Panama'                           ),
   PG : new MV.MVXP.Geo.COUNTRY   ( 'PG',      'PNG',      598,      'PP',      675,      'Papua New Guinea'                 ),
   PY : new MV.MVXP.Geo.COUNTRY   ( 'PY',      'PRY',      600,      'PA',      595,      'Paraguay'                         ),
   PE : new MV.MVXP.Geo.COUNTRY   ( 'PE',      'PER',      604,      'PE',       51,      'Peru'                             ),
   PH : new MV.MVXP.Geo.COUNTRY   ( 'PH',      'PHL',      608,      'RP',       63,      'Philippines'                      ),
   PL : new MV.MVXP.Geo.COUNTRY   ( 'PL',      'POL',      616,      'PL',       48,      'Poland'                           ),
   PT : new MV.MVXP.Geo.COUNTRY   ( 'PT',      'PRT',      620,      'PO',      351,      'Portugal'                         ),
   QA : new MV.MVXP.Geo.COUNTRY   ( 'QA',      'QAT',      634,      'QA',      974,      'Qatar'                            ),
   CG : new MV.MVXP.Geo.COUNTRY   ( 'CG',      'COG',      178,      'CF',      242,      'Republic of the Congo'            ),
   RO : new MV.MVXP.Geo.COUNTRY   ( 'RO',      'ROU',      642,      'RO',       40,      'Romania'                          ),
   RU : new MV.MVXP.Geo.COUNTRY   ( 'RU',      'RUS',      643,      'RS',        7,      'Russia'                           ),
   RW : new MV.MVXP.Geo.COUNTRY   ( 'RW',      'RWA',      646,      'RW',      250,      'Rwanda'                           ),
   KN : new MV.MVXP.Geo.COUNTRY   ( 'KN',      'KNA',      659,      'SC',        1,      'Saint Kitts and Nevis'            ),
   LC : new MV.MVXP.Geo.COUNTRY   ( 'LC',      'LCA',      662,      'ST',        1,      'Saint Lucia'                      ),
   VC : new MV.MVXP.Geo.COUNTRY   ( 'VC',      'VCT',      670,      'VC',        1,      'Saint Vincent and the Grenadines' ),
   WS : new MV.MVXP.Geo.COUNTRY   ( 'WS',      'WSM',      882,      'WS',      685,      'Samoa'                            ),
   SM : new MV.MVXP.Geo.COUNTRY   ( 'SM',      'SMR',      674,      'SM',      378,      'San Marino'                       ),
   ST : new MV.MVXP.Geo.COUNTRY   ( 'ST',      'STP',      678,      'TP',      239,      'S\xe3o Tom\xe9 and Pr\xedncipe'   ),
   SA : new MV.MVXP.Geo.COUNTRY   ( 'SA',      'SAU',      682,      'SA',      966,      'Saudi Arabia'                     ),
   SN : new MV.MVXP.Geo.COUNTRY   ( 'SN',      'SEN',      686,      'SG',      221,      'Senegal'                          ),
   RS : new MV.MVXP.Geo.COUNTRY   ( 'RS',      'SRB',      688,      'RI',      381,      'Serbia'                           ),
   SC : new MV.MVXP.Geo.COUNTRY   ( 'SC',      'SYC',      690,      'SE',      248,      'Seychelles'                       ),
   SL : new MV.MVXP.Geo.COUNTRY   ( 'SL',      'SLE',      694,      'SL',      232,      'Sierra Leone'                     ),
   SG : new MV.MVXP.Geo.COUNTRY   ( 'SG',      'SGP',      702,      'SN',       65,      'Singapore'                        ),
   SK : new MV.MVXP.Geo.COUNTRY   ( 'SK',      'SVK',      703,      'LO',      421,      'Slovakia'                         ),
   SI : new MV.MVXP.Geo.COUNTRY   ( 'SI',      'SVN',      705,      'SI',      386,      'Slovenia'                         ),
   SB : new MV.MVXP.Geo.COUNTRY   ( 'SB',      'SLB',       90,      'BP',      677,      'Solomon Islands'                  ),
   SO : new MV.MVXP.Geo.COUNTRY   ( 'SO',      'SOM',      706,      'SO',      252,      'Somalia'                          ),
   ZA : new MV.MVXP.Geo.COUNTRY   ( 'ZA',      'ZAF',      710,      'SF',       27,      'South Africa'                     ),
   KR : new MV.MVXP.Geo.COUNTRY   ( 'KR',      'KOR',      410,      'KS',       82,      'South Korea'                      ),
   SS : new MV.MVXP.Geo.COUNTRY   ( 'SS',      'SSD',      728,      'OD',      211,      'South Sudan'                      ),
   ES : new MV.MVXP.Geo.COUNTRY   ( 'ES',      'ESP',      724,      'SP',       34,      'Spain'                            ),
   LK : new MV.MVXP.Geo.COUNTRY   ( 'LK',      'LKA',      144,      'CE',       94,      'Sri Lanka'                        ),
   SD : new MV.MVXP.Geo.COUNTRY   ( 'SD',      'SDN',      729,      'SU',      249,      'Sudan'                            ),
   SR : new MV.MVXP.Geo.COUNTRY   ( 'SR',      'SUR',      740,      'NS',      597,      'Suriname'                         ),
   SE : new MV.MVXP.Geo.COUNTRY   ( 'SE',      'SWE',      752,      'SW',       46,      'Sweden'                           ),
   CH : new MV.MVXP.Geo.COUNTRY   ( 'CH',      'CHE',      756,      'SZ',       41,      'Switzerland'                      ),
   SY : new MV.MVXP.Geo.COUNTRY   ( 'SY',      'SYR',      760,      'SY',      963,      'Syria'                            ),
   TW : new MV.MVXP.Geo.COUNTRY   ( 'TW',      'TWN',      158,      'TW',      886,      'Taiwan'                           ),
   TJ : new MV.MVXP.Geo.COUNTRY   ( 'TJ',      'TJK',      762,      'TI',      992,      'Tajikistan'                       ),
   TZ : new MV.MVXP.Geo.COUNTRY   ( 'TZ',      'TZA',      834,      'TZ',      255,      'Tanzania'                         ),
   TH : new MV.MVXP.Geo.COUNTRY   ( 'TH',      'THA',      764,      'TH',       66,      'Thailand'                         ),
   BS : new MV.MVXP.Geo.COUNTRY   ( 'BS',      'BHS',       44,      'BF',        1,      'The Bahamas'                      ),
   GM : new MV.MVXP.Geo.COUNTRY   ( 'GM',      'GMB',      270,      'GA',      220,      'The Gambia'                       ),
   TG : new MV.MVXP.Geo.COUNTRY   ( 'TG',      'TGO',      768,      'TO',      228,      'Togo'                             ),
   TO : new MV.MVXP.Geo.COUNTRY   ( 'TO',      'TON',      776,      'TN',      676,      'Tonga'                            ),
   TT : new MV.MVXP.Geo.COUNTRY   ( 'TT',      'TTO',      780,      'TD',        1,      'Trinidad and Tobago'              ),
   TN : new MV.MVXP.Geo.COUNTRY   ( 'TN',      'TUN',      788,      'TS',      216,      'Tunisia'                          ),
   TR : new MV.MVXP.Geo.COUNTRY   ( 'TR',      'TUR',      792,      'TU',       90,      'Turkey'                           ),
   TM : new MV.MVXP.Geo.COUNTRY   ( 'TM',      'TKM',      795,      'TX',      993,      'Turkmenistan'                     ),
   TV : new MV.MVXP.Geo.COUNTRY   ( 'TV',      'TUV',      798,      'TV',      688,      'Tuvalu'                           ),
   UG : new MV.MVXP.Geo.COUNTRY   ( 'UG',      'UGA',      800,      'UG',      256,      'Uganda'                           ),
   UA : new MV.MVXP.Geo.COUNTRY   ( 'UA',      'UKR',      804,      'UP',      380,      'Ukraine'                          ),
   AE : new MV.MVXP.Geo.COUNTRY   ( 'AE',      'ARE',      784,      'AE',      971,      'United Arab Emirates'             ),
   GB : new MV.MVXP.Geo.COUNTRY   ( 'GB',      'GBR',      826,      'UK',       44,      'United Kingdom'                   ),
   US : new MV.MVXP.Geo.COUNTRY   ( 'US',      'USA',      840,      'US',        1,      'United States'                    ),
   UY : new MV.MVXP.Geo.COUNTRY   ( 'UY',      'URY',      858,      'UY',      598,      'Uruguay'                          ),
   UZ : new MV.MVXP.Geo.COUNTRY   ( 'UZ',      'UZB',      860,      'UZ',      998,      'Uzbekistan'                       ),
   VU : new MV.MVXP.Geo.COUNTRY   ( 'VU',      'VUT',      548,      'NH',      678,      'Vanuatu'                          ),
   VA : new MV.MVXP.Geo.COUNTRY   ( 'VA',      'VAT',      336,      'VT',       39,      'Vatican City'                     ),
   VE : new MV.MVXP.Geo.COUNTRY   ( 'VE',      'VEN',      862,      'VE',       58,      'Venezuela'                        ),
   VN : new MV.MVXP.Geo.COUNTRY   ( 'VN',      'VNM',      704,      'VM',       84,      'Vietnam'                          ),
   YE : new MV.MVXP.Geo.COUNTRY   ( 'YE',      'YEM',      887,      'YM',      967,      'Yemen'                            ),
   ZM : new MV.MVXP.Geo.COUNTRY   ( 'ZM',      'ZMB',      894,      'ZA',      260,      'Zambia'                           ),
   ZW : new MV.MVXP.Geo.COUNTRY   ( 'ZW',      'ZWE',      716,      'ZI',      263,      'Zimbabwe'                         ),
};

MV.MVXP.Geo.apTerritory =
{

   AX : new MV.MVXP.Geo.TERRITORY ( 'AX',      'ALA',      248,      null,      358,      '\xc5land',                                      'FI',    'AR' ),
   AS : new MV.MVXP.Geo.TERRITORY ( 'AS',      'ASM',       16,      'AQ',        1,      'American Samoa',                                'US',    'IA' ),
   AI : new MV.MVXP.Geo.TERRITORY ( 'AI',      'AIA',      660,      'AV',        1,      'Anguilla',                                      'GB',    'OT' ),
   AW : new MV.MVXP.Geo.TERRITORY ( 'AW',      'ABW',      533,      'AA',      297,      'Aruba',                                         'NL',    'CC' ),
   BM : new MV.MVXP.Geo.TERRITORY ( 'BM',      'BMU',       60,      'BD',        1,      'Bermuda',                                       'GB',    'OT' ),
   IO : new MV.MVXP.Geo.TERRITORY ( 'IO',      'IOT',       86,      'IO',      246,      'British Indian Ocean Territory',                'GB',    'OT' ),
   VG : new MV.MVXP.Geo.TERRITORY ( 'VG',      'VGB',       92,      'VI',        1,      'British Virgin Islands',                        'GB',    'OT' ),
   BQ : new MV.MVXP.Geo.TERRITORY ( 'BQ',      'BES',      535,      null,      599,      'Caribbean Netherlands',                         'NL',    'SM' ),
   KY : new MV.MVXP.Geo.TERRITORY ( 'KY',      'CYM',      136,      'CJ',        1,      'Cayman Islands',                                'GB',    'OT' ),
   CX : new MV.MVXP.Geo.TERRITORY ( 'CX',      'CXR',      162,      'KT',       61,      'Christmas Island',                              'AU',    'ET' ),
   CC : new MV.MVXP.Geo.TERRITORY ( 'CC',      'CCK',      166,      'CK',       61,      'Cocos (Keeling) Islands',                       'AU',    'ET' ),
   CW : new MV.MVXP.Geo.TERRITORY ( 'CW',      'CUW',      531,      'UC',      599,      'Cura\xe7ao',                                    'NL',    'CC' ),
   FK : new MV.MVXP.Geo.TERRITORY ( 'FK',      'FLK',      238,      'FK',      500,      'Falkland Islands',                              'GB',    'OT' ),
   FO : new MV.MVXP.Geo.TERRITORY ( 'FO',      'FRO',      234,      'FO',      298,      'Faroe Islands',                                 'DK',    'AT' ),
   GF : new MV.MVXP.Geo.TERRITORY ( 'GF',      'GUF',      254,      'FG',      594,      'French Guiana',                                 'FR',    'OR' ),
   PF : new MV.MVXP.Geo.TERRITORY ( 'PF',      'PYF',      258,      'FP',      689,      'French Polynesia',                              'FR',    'OC' ),
   GI : new MV.MVXP.Geo.TERRITORY ( 'GI',      'GIB',      292,      'GI',      350,      'Gibraltar',                                     'GB',    'OT' ),
   GL : new MV.MVXP.Geo.TERRITORY ( 'GL',      'GRL',      304,      'GL',      299,      'Greenland',                                     'DK',    'AT' ),
   GP : new MV.MVXP.Geo.TERRITORY ( 'GP',      'GLP',      312,      'GP',      590,      'Guadeloupe',                                    'FR',    'OR' ),
   GU : new MV.MVXP.Geo.TERRITORY ( 'GU',      'GUM',      316,      'GQ',        1,      'Guam',                                          'US',    'IA' ),
   GG : new MV.MVXP.Geo.TERRITORY ( 'GG',      'GGY',      831,      'GK',       44,      'Guernsey',                                      'GB',    'CD' ),
   HK : new MV.MVXP.Geo.TERRITORY ( 'HK',      'HKG',      344,      'HK',      852,      'Hong Kong',                                     'CN',    'SR' ),
   IM : new MV.MVXP.Geo.TERRITORY ( 'IM',      'IMN',      833,      'IM',       44,      'Isle of Man',                                   'GB',    'CD' ),
   JE : new MV.MVXP.Geo.TERRITORY ( 'JE',      'JEY',      832,      'JE',       44,      'Jersey',                                        'GB',    'CD' ),
   MO : new MV.MVXP.Geo.TERRITORY ( 'MO',      'MAC',      446,      'MC',      853,      'Macau',                                         'CN',    'SR' ),
   MQ : new MV.MVXP.Geo.TERRITORY ( 'MQ',      'MTQ',      474,      'MB',      596,      'Martinique',                                    'FR',    'OR' ),
   YT : new MV.MVXP.Geo.TERRITORY ( 'YT',      'MYT',      175,      'MF',      262,      'Mayotte',                                       'FR',    'OR' ),
   MS : new MV.MVXP.Geo.TERRITORY ( 'MS',      'MSR',      500,      'MH',        1,      'Montserrat',                                    'GB',    'OT' ),
   NC : new MV.MVXP.Geo.TERRITORY ( 'NC',      'NCL',      540,      'NC',      687,      'New Caledonia',                                 'FR',    'OC' ),
   NF : new MV.MVXP.Geo.TERRITORY ( 'NF',      'NFK',      574,      'NF',      672,      'Norfolk Island',                                'AU',    'ET' ),
   MP : new MV.MVXP.Geo.TERRITORY ( 'MP',      'MNP',      580,      'CQ',        1,      'Northern Mariana Islands',                      'US',    'IA' ),

   PR : new MV.MVXP.Geo.TERRITORY ( 'PR',      'PRI',      630,      'RQ',        1,      'Puerto Rico',                                   'US',    'IA' ),
   RE : new MV.MVXP.Geo.TERRITORY ( 'RE',      'REU',      638,      'RE',      262,      'R\xe9union',                                    'FR',    'OR' ),
   BL : new MV.MVXP.Geo.TERRITORY ( 'BL',      'BLM',      652,      'TB',      590,      'Saint Barth\xe9lemy',                           'FR',    'OC' ),
   SH : new MV.MVXP.Geo.TERRITORY ( 'SH',      'SHN',      654,      'SH',      290,      'Saint Helena, Ascension and Tristan da Cunha',  'GB',    'OT' ),
   MF : new MV.MVXP.Geo.TERRITORY ( 'MF',      'MAF',      663,      'RN',      590,      'Saint Martin',                                  'FR',    'OC' ),
   PM : new MV.MVXP.Geo.TERRITORY ( 'PM',      'SPM',      666,      'SB',      508,      'Saint Pierre and Miquelon',                     'FR',    'OC' ),
   SX : new MV.MVXP.Geo.TERRITORY ( 'SX',      'SXM',      534,      'NN',        1,      'Sint Maarten',                                  'NL',    'CC' ),

   SJ : new MV.MVXP.Geo.TERRITORY ( 'SJ',      'SJM',      744,      'SV',       47,      'Svalbard and Jan Mayen',                        'NO',    'TE' ),
   TK : new MV.MVXP.Geo.TERRITORY ( 'TK',      'TKL',      772,      'TL',      690,      'Tokelau',                                       'NZ',    'DT' ),
   TC : new MV.MVXP.Geo.TERRITORY ( 'TC',      'TCA',      796,      'TK',        1,      'Turks and Caicos Islands',                      'GB',    'OT' ),
   VI : new MV.MVXP.Geo.TERRITORY ( 'VI',      'VIR',      850,      'VQ',        1,      'United States Virgin Islands',                  'US',    'IA' ),
   WF : new MV.MVXP.Geo.TERRITORY ( 'WF',      'WLF',      876,      'WF',      681,      'Wallis and Futuna',                             'FR',    'OC' ),
};

MV.MVXP.Geo.apRegion = { ...MV.MVXP.Geo.apCountry, ...MV.MVXP.Geo.apTerritory };

MV.MVXP.Geo.apState =
{

   ZZ : new MV.MVXP.Geo.STATE     ( 'ZZ',      '<null>',                                        'ZZ',    'ZZ' ),

   AB : new MV.MVXP.Geo.STATE     ( 'AB',      'Alberta',                                       'CA',    'PR' ),
   BC : new MV.MVXP.Geo.STATE     ( 'BC',      'British Columbia',                              'CA',    'PR' ),
   MB : new MV.MVXP.Geo.STATE     ( 'MB',      'Manitoba',                                      'CA',    'PR' ),
   NB : new MV.MVXP.Geo.STATE     ( 'NB',      'New Brunswick',                                 'CA',    'PR' ),
   NL : new MV.MVXP.Geo.STATE     ( 'NL',      'Newfoundland and Labrador',                     'CA',    'PR' ),
   NS : new MV.MVXP.Geo.STATE     ( 'NS',      'Nova Scotia',                                   'CA',    'PR' ),
   ON : new MV.MVXP.Geo.STATE     ( 'ON',      'Ontario',                                       'CA',    'PR' ),
   PE : new MV.MVXP.Geo.STATE     ( 'PE',      'Prince Edward Island',                          'CA',    'PR' ),
   QC : new MV.MVXP.Geo.STATE     ( 'QC',      'Quebec',                                        'CA',    'PR' ),
   SK : new MV.MVXP.Geo.STATE     ( 'SK',      'Saskatchewan',                                  'CA',    'PR' ),
   NT : new MV.MVXP.Geo.STATE     ( 'NT',      'Northwest Territories',                         'CA',    'PR' ),
   NU : new MV.MVXP.Geo.STATE     ( 'NU',      'Nunavut',                                       'CA',    'PR' ),
   YT : new MV.MVXP.Geo.STATE     ( 'YT',      'Yukon Territory',                               'CA',    'PR' ),

   EN : new MV.MVXP.Geo.STATE     ( 'EN',      'England',                                       'GB',    'ST' ),
   NI : new MV.MVXP.Geo.STATE     ( 'NI',      'Northern Ireland',                              'GB',    'ST' ),
   SL : new MV.MVXP.Geo.STATE     ( 'SL',      'Scotland',                                      'GB',    'ST' ),
   WL : new MV.MVXP.Geo.STATE     ( 'WL',      'Wales',                                         'GB',    'ST' ),

   AL : new MV.MVXP.Geo.STATE     ( 'AL',      'Alabama',                                       'US',    'ST' ),
   AK : new MV.MVXP.Geo.STATE     ( 'AK',      'Alaska',                                        'US',    'ST' ),
   AZ : new MV.MVXP.Geo.STATE     ( 'AZ',      'Arizona',                                       'US',    'ST' ),
   AR : new MV.MVXP.Geo.STATE     ( 'AR',      'Arkansas',                                      'US',    'ST' ),
   CA : new MV.MVXP.Geo.STATE     ( 'CA',      'California',                                    'US',    'ST' ),
   CO : new MV.MVXP.Geo.STATE     ( 'CO',      'Colorado',                                      'US',    'ST' ),
   CT : new MV.MVXP.Geo.STATE     ( 'CT',      'Connecticut',                                   'US',    'ST' ),
   DE : new MV.MVXP.Geo.STATE     ( 'DE',      'Delaware',                                      'US',    'ST' ),
   FL : new MV.MVXP.Geo.STATE     ( 'FL',      'Florida',                                       'US',    'ST' ),
   GA : new MV.MVXP.Geo.STATE     ( 'GA',      'Georgia',                                       'US',    'ST' ),
   HI : new MV.MVXP.Geo.STATE     ( 'HI',      'Hawaii',                                        'US',    'ST' ),
   ID : new MV.MVXP.Geo.STATE     ( 'ID',      'Idaho',                                         'US',    'ST' ),
   IL : new MV.MVXP.Geo.STATE     ( 'IL',      'Illinois',                                      'US',    'ST' ),
   IN : new MV.MVXP.Geo.STATE     ( 'IN',      'Indiana',                                       'US',    'ST' ),
   IA : new MV.MVXP.Geo.STATE     ( 'IA',      'Iowa',                                          'US',    'ST' ),
   KS : new MV.MVXP.Geo.STATE     ( 'KS',      'Kansas',                                        'US',    'ST' ),
   KY : new MV.MVXP.Geo.STATE     ( 'KY',      'Kentucky',                                      'US',    'ST' ),
   LA : new MV.MVXP.Geo.STATE     ( 'LA',      'Louisiana',                                     'US',    'ST' ),
   ME : new MV.MVXP.Geo.STATE     ( 'ME',      'Maine',                                         'US',    'ST' ),
   MD : new MV.MVXP.Geo.STATE     ( 'MD',      'Maryland',                                      'US',    'ST' ),
   MA : new MV.MVXP.Geo.STATE     ( 'MA',      'Massachusetts',                                 'US',    'ST' ),
   MI : new MV.MVXP.Geo.STATE     ( 'MI',      'Michigan',                                      'US',    'ST' ),
   MN : new MV.MVXP.Geo.STATE     ( 'MN',      'Minnesota',                                     'US',    'ST' ),
   MS : new MV.MVXP.Geo.STATE     ( 'MS',      'Mississippi',                                   'US',    'ST' ),
   MO : new MV.MVXP.Geo.STATE     ( 'MO',      'Missouri',                                      'US',    'ST' ),
   MT : new MV.MVXP.Geo.STATE     ( 'MT',      'Montana',                                       'US',    'ST' ),
   NE : new MV.MVXP.Geo.STATE     ( 'NE',      'Nebraska',                                      'US',    'ST' ),
   NV : new MV.MVXP.Geo.STATE     ( 'NV',      'Nevada',                                        'US',    'ST' ),
   NH : new MV.MVXP.Geo.STATE     ( 'NH',      'New Hampshire',                                 'US',    'ST' ),
   NJ : new MV.MVXP.Geo.STATE     ( 'NJ',      'New Jersey',                                    'US',    'ST' ),
   NM : new MV.MVXP.Geo.STATE     ( 'NM',      'New Mexico',                                    'US',    'ST' ),
   NY : new MV.MVXP.Geo.STATE     ( 'NY',      'New York',                                      'US',    'ST' ),
   NC : new MV.MVXP.Geo.STATE     ( 'NC',      'North Carolina',                                'US',    'ST' ),
   ND : new MV.MVXP.Geo.STATE     ( 'ND',      'North Dakota',                                  'US',    'ST' ),
   OH : new MV.MVXP.Geo.STATE     ( 'OH',      'Ohio',                                          'US',    'ST' ),
   OK : new MV.MVXP.Geo.STATE     ( 'OK',      'Oklahoma',                                      'US',    'ST' ),
   OR : new MV.MVXP.Geo.STATE     ( 'OR',      'Oregon',                                        'US',    'ST' ),
   PA : new MV.MVXP.Geo.STATE     ( 'PA',      'Pennsylvania',                                  'US',    'ST' ),
   RI : new MV.MVXP.Geo.STATE     ( 'RI',      'Rhode Island',                                  'US',    'ST' ),
   SC : new MV.MVXP.Geo.STATE     ( 'SC',      'South Carolina',                                'US',    'ST' ),
   SD : new MV.MVXP.Geo.STATE     ( 'SD',      'South Dakota',                                  'US',    'ST' ),
   TN : new MV.MVXP.Geo.STATE     ( 'TN',      'Tennessee',                                     'US',    'ST' ),
   TX : new MV.MVXP.Geo.STATE     ( 'TX',      'Texas',                                         'US',    'ST' ),
   UT : new MV.MVXP.Geo.STATE     ( 'UT',      'Utah',                                          'US',    'ST' ),
   VT : new MV.MVXP.Geo.STATE     ( 'VT',      'Vermont',                                       'US',    'ST' ),
   VA : new MV.MVXP.Geo.STATE     ( 'VA',      'Virginia',                                      'US',    'ST' ),
   WA : new MV.MVXP.Geo.STATE     ( 'WA',      'Washington',                                    'US',    'ST' ),
   WV : new MV.MVXP.Geo.STATE     ( 'WV',      'West Virginia',                                 'US',    'ST' ),
   WI : new MV.MVXP.Geo.STATE     ( 'WI',      'Wisconsin',                                     'US',    'ST' ),
   WY : new MV.MVXP.Geo.STATE     ( 'WY',      'Wyoming',                                       'US',    'ST' ),
   DC : new MV.MVXP.Geo.STATE     ( 'DC',      'District of Columbia',                          'US',    'ST' ),
};

MV.MVXP.SMS = class
{
   #pLnG       = null;
   #pSMSObject = null;
   #bLog       = false;

   constructor (sConnect, sSession)
   {
      this.#pLnG = MV.MVMF.Core.LnG_Open ('metaversal/rp1', 'MVSB', sConnect, sSession);
      this.#pLnG.Attach (this);
   }

   destructor ()
   {
      this.Quit ();
   }

   onReadyState (pNotify)
   {
      if (pNotify.pCreator == this.#pLnG)
      {
         if (this.#pLnG.ReadyState () >= this.#pLnG.eSTATE.LOGGEDOUT)
         {
            if (this.#pSMSObject == null)
               this.Root ();
         }
      }
      else if (pNotify.pCreator == this.#pSMSObject)
      {
         if (this.#pSMSObject.ReadyState () >= this.#pSMSObject.eSTATE.PARTIAL)
            if (this.#bLog == false)
            {
               this.#bLog = true;
               this.#pSMSObject.Log ();
            }
      }
   }

   #Response (pIAction, pSMSObject)
   {
      if (pIAction.dwResult == 0)
      {

         setTimeout (pSMSObject.Log.bind (pSMSObject), 250);
      }
      else console.log ('ERROR: ', pIAction);
   }

   Quit ()
   {
      if (this.#pLnG)
      {
         if (this.#pSMSObject)
         {
            this.#pSMSObject.Detach (this);
            this.#pSMSObject = this.#pLnG.Model_Close (this.#pSMSObject)
         }

         this.#pLnG.Detatch ();
         this.#pLnG = MV.MVMF.Core.LnG_Close (this.#pLnG);
      }
   }

   Root ()
   {
      if (this.#pLnG)
      {
         if (this.#pSMSObject)
         {
            this.#pSMSObject.Detach (this);
            this.#pSMSObject = this.#pLnG.Model_Close (this.#pSMSObject)
         }

         this.#bLog       = false;
         this.#pSMSObject = this.#pLnG.Model_Open ('RegionRoot', '1');
         this.#pSMSObject.Attach (this);
      }
   }

   Country (sISO2)
   {
      if (this.#pLnG)
      {
         if (this.#pSMSObject)
         {
            this.#pSMSObject.Detach (this);
            this.#pSMSObject = this.#pLnG.Model_Close (this.#pSMSObject)
         }

         this.#bLog       = false;
         this.#pSMSObject = this.#pLnG.Model_Open ('Region', sISO2);
         this.#pSMSObject.Attach (this);
      }
   }

   Help ()
   {
      if (this.#pSMSObject  &&  this.#pSMSObject.Help)
         this.#pSMSObject.Help ();
   }

   List ()
   {
      if (this.#pSMSObject  &&  this.#pSMSObject.List)
         this.#pSMSObject.List ();
   }

   Pause ()
   {

      if (this.#pSMSObject  &&  this.#pSMSObject.Pause)
         this.#pSMSObject.Pause (this, this.#Response, this.#pSMSObject);
   }

   Continue ()
   {

      if (this.#pSMSObject  &&  this.#pSMSObject.Continue)
         this.#pSMSObject.Continue (this, this.#Response, this.#pSMSObject);
   }

   Update (twSMSFormatIx, sFormat)
   {

      if (this.#pSMSObject  &&  this.#pSMSObject.Update)
         this.#pSMSObject.Update (twSMSFormatIx, sFormat, this, this.#Response, this.#pSMSObject);
   }
}

MV.MVXP.Install = function (pCore, pPlugin)
{
   let bResult = true;

   if (this.pRequire = pCore.Require ('MVMF,MVSB'))
   {
      MV.MVXP.SB_SESSION_C2A .init ();

      this.apFactory_Model =
      [
         MV.MVXP.APPLIC             .factory (),
         MV.MVXP.REGIONROOT         .factory (),
         MV.MVXP.REGION             .factory (),
         MV.MVXP.REGION_SMSFORMAT   .factory (),
         MV.MVXP.REGION_SMSPREFIX   .factory (),
         MV.MVXP.USERROOT           .factory (),
         MV.MVXP.USER               .factory (),
         MV.MVXP.USER_SESSION       .factory (),
      ];

      this.apFactory_Source =
      [
         MV.MVXP.SB_APPLIC          .factory (),
         MV.MVXP.SB_REGIONROOT      .factory (),
         MV.MVXP.SB_REGION          .factory (),
         MV.MVXP.SB_REGION_SMSFORMAT.factory (),
         MV.MVXP.SB_REGION_SMSPREFIX.factory (),
         MV.MVXP.SB_USERROOT        .factory (),
         MV.MVXP.SB_USER            .factory (),
         MV.MVXP.SB_USER_SESSION    .factory (),
         MV.MVXP.SB_SESSION_C2A     .factory (),
      ];

      pPlugin.Factory_Models   (this.apFactory_Model);
      pPlugin.Factory_Sources  (this.apFactory_Source);
   }
   else bResult = false;

   return bResult;
}

MV.MVXP.Unstall = function (pCore, pPlugin)
{
   let n;

   if (this.pRequire)
   {
      for (n=0; n<this.apFactory_Model.length; n++)
         this.apFactory_Model[n] = this.apFactory_Model[n].destructor ();

      for (n=0; n<this.apFactory_Source.length; n++)
         this.apFactory_Source[n] = this.apFactory_Source[n].destructor ();

      this.pRequire = pCore.Release (this.pRequire);
   }
}

