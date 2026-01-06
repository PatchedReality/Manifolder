
/*
import { MV } from '@metaversalcorp/mvmf'
*/
/*
const { MV } = require ('@metaversalcorp/mvmf');
*/

MV.MVSB = MV.Library ('MVSB', 'Copyright 2014-2024 Metaversal Corporation. All rights reserved.', 'Metaversal Statabase Service', '0.23.4');

MV.MVSB.TIME = class
{
   constructor (pITime)
   {
      this.tmSystem_Current = 0;

      this.pITime           = pITime;

      if (typeof (navigator) !== 'undefined')
      {
         this.fTimeout         = this.onTimeout.bind (this);
         this.pTimeout         = new Promise (function (fResolve) { fResolve (true); });
         this.iTimeout         = setInterval (this.fTimeout, 4);
      }
   }

   destructor ()
   {
      clearInterval (this.iTimeout);
      this.iTimeout = null;

      return null;
   }

   onTimeout (bInterrupt)
   {
      let bResult   = false;
      let ptCurrent = Math.round (performance.timeOrigin) + performance.now ();
      let tmCurrent = this.FromPosixTime (ptCurrent);

      if (this.tmSystem_Current < tmCurrent)
      {
         if (!bInterrupt)
         {
            this.tmSystem_Current = tmCurrent;

            this.pITime.Tick (this.tmSystem_Current);
         }
         else bResult = true;
      }

      return bResult;
   }

   Interrupt (bExec)
   {
      let bInterrupt = !bExec;

      if (this.fTimeout (bInterrupt))
      {
         this.pTimeout.then (this.fTimeout);
      }
   }

   ToPosixTime (tmValue)
   {
      tmValue -= 745246310400;

      tmValue *= 1000;
      tmValue += 32;
      tmValue /= 64;

      return Math.floor (tmValue);
   }

   FromPosixTime (ptValue)
   {
      ptValue *= 64;
      ptValue += 500;
      ptValue /= 1000;

      ptValue += 745246310400;

      return Math.floor (ptValue);
   }

   ToSystemTime (tmValue, dtResult)
   {
      let ptValue = this.ToPosixTime (tmValue);

      dtResult.setTime (ptValue);

      return true;
   }

   FromSystemTime (dtValue)
   {
      let ptValue = dtValue.getTime ();

      return this.FromPosixTime (ptValue);
   }

   ToTimex (tmBase, tmOffset)
   {
      let txResult = tmOffset - tmBase;

      if (txResult < -2147483648  ||  txResult >= 2147483648)
         txResult = (-2147483647 - 1);

      return txResult;
   }

   FromTimex (tmBase, txOffset)
   {

      return tmBase + txOffset;
   }

   ConvertTimex (tmBaseTo, tmBaseFrom, txOffset)
   {
      return this.ToTimex (tmBaseTo, this.FromTimex (tmBaseFrom, txOffset));
   }

   Current ()
   {
      return this.tmSystem_Current;
   }

   Currentx (tmBase)
   {
      return this.ToTimex (tmBase, this.Current ());
   }
}

MV.MVSB.TIME.ITIME = class
{
   destructor ()
   {
      return null;
   }

   Tick (tmSystem_Current)
   {
   }
}

MV.MVSB.BYTEARRAY = class
{
   #nError = 0;
   #nBytes = 0;

   constructor ()
   {
      this.ab = new ArrayBuffer (8);
      this.dv = new DataView    (this.ab);
      this.u8 = new Uint8Array  (this.ab);
   }

   destructor ()
   {
      return null;
   }

   get nError () { return this.#nError; }
   get nBytes () { return this.#nBytes; }

   Clear (u8a, offset, bytes)
   {
      while (bytes-- > 0)
         u8a[offset++] = 0;

      return true;
   }

   Write_Binary (u8a, offset, bytes, value)
   {
      let i;

      for (i = 0; i < value.length && bytes-- > 0; i++)
         u8a[offset++] = value[i];
      while (bytes-- > 0)
         u8a[offset++] = 0;

      return true;
   }

   Write_String (u8a, offset, bytes, value)
   {
      let i;

      for (i = 0; i < value.length && bytes-- > 0; i++)
         u8a[offset++] = ('0x' + value.charCodeAt (i).toString (16));
      while (bytes-- > 0)
         u8a[offset++] = 0;

      return true;
   }

   Write_String_W (u8a, offset, bytes, value)
   {
      let i;

      for (i = 0; i * 2 + 1 < bytes; i++)
      {
         let wc = i < value.length ? value.charCodeAt (i) : 0;
         let wc_lo = (wc >> 0) & 0x00FF;
         let wc_hi = (wc >> 8) & 0x00FF;

         u8a[offset++] = ('0x' + wc_lo.toString (16));
         u8a[offset++] = ('0x' + wc_hi.toString (16));
      }

      return true;
   }

   Read_Binary (u8a, offset, bytes)
   {
      let value, i;

      value = new Uint8Array (bytes);

      for (i = 0; i < bytes; i++)
         value[i] = u8a[offset++];

      return value;
   }

   Read_String (u8a, offset, bytes)
   {
      let i, a = [];

      for (i=0; i<bytes && offset<u8a.length && u8a[offset]!=0; i++)
      {
         a.push (u8a[offset++]);
      }

      return String.fromCharCode.apply (null, a);
   }

   Read_String_W (u8a, offset, bytes)
   {
      let i, a = [];

      for (i=0; i+1<bytes && offset+1<u8a.length && (u8a[offset+0]!=0 || u8a[offset+1]!=0); i+=2)
      {
         a.push (u8a[offset++] + (u8a[offset++] << 8));
      }

      return String.fromCharCode.apply (null, a);
   }

   Write (u8a, offset, length)
   {
      let i;

      if (length >= 0  &&  offset + length <= u8a.length)
      {
         for (i=0; i<length; i++)
            u8a[offset + i] = this.u8[i];

         this.#nBytes = length;
         this.#nError = 0;
      }
      else this.#nError = 1;
   }

   Read (u8a, offset, length)
   {
      let i;

      if (length >= 0  &&  offset + length <= u8a.length)
      {
         for (i=0; i<length; i++)
            this.u8[i] = u8a[offset + i];

         for (; i>4 && i<8; i++)
            this.u8[i] = 0;

         this.#nBytes = length;
         this.#nError = 0;
      }
      else this.#nError = 1;
   }

   Write_Number (u8a, offset, bytes, value, nType)
   {
      switch ((nType - MV.MVSB.MAP.FIELD.eTYPE.NUMBER_UNSIGNED) * 10 + (bytes - 1))
      {
         case  0: this.dv.setUint8     (0,         value,  true); break;
         case  1: this.dv.setUint16    (0,         value,  true); break;
         case  3: this.dv.setUint32    (0,         value,  true); break;
         case  5: this.dv.setBigUint64 (0, BigInt (value), true); break;
         case  7: this.dv.setBigUint64 (0, BigInt (value), true); break;

         case 10: this.dv.setInt8      (0,         value,  true); break;
         case 11: this.dv.setInt16     (0,         value,  true); break;
         case 13: this.dv.setInt32     (0,         value,  true); break;
         case 15: this.dv.setBigInt64  (0, BigInt (value), true); break;
         case 17: this.dv.setBigInt64  (0, BigInt (value), true); break;

         case 23: this.dv.setFloat32   (0,         value,  true); break;
         case 27: this.dv.setFloat64   (0,         value,  true); break;

         default:
            bytes = 0;
      }

      if (bytes > 0)
         this.Write (u8a, offset, bytes);
   }

   Read_Number (u8a, offset, bytes, nType)
   {
      let nRet = 0;

      this.Read (u8a, offset, bytes);

      switch ((nType - MV.MVSB.MAP.FIELD.eTYPE.NUMBER_UNSIGNED) * 10 + (bytes - 1))
      {
         case  0: nRet =         this.dv.getUint8     (0, true);  break;
         case  1: nRet =         this.dv.getUint16    (0, true);  break;
         case  3: nRet =         this.dv.getUint32    (0, true);  break;
         case  5: nRet = Number (this.dv.getBigUint64 (0, true)); break;
         case  7: nRet = Number (this.dv.getBigUint64 (0, true)); break;

         case 10: nRet =         this.dv.getInt8      (0, true);  break;
         case 11: nRet =         this.dv.getInt16     (0, true);  break;
         case 13: nRet =         this.dv.getInt32     (0, true);  break;
         case 15: nRet = Number (this.dv.getBigInt64  (0, true)); break;
         case 17: nRet = Number (this.dv.getBigInt64  (0, true)); break;

         case 23: nRet =         this.dv.getFloat32   (0, true);  break;
         case 27: nRet =         this.dv.getFloat64   (0, true);  break;
      }

      return nRet;
   }
}

MV.MVSB.ByteArray = new MV.MVSB.BYTEARRAY ();

MV.MVSB.MAP = class
{
   m_asRead  = ['Read_Binary',  'Read_String',  'Read_String_W',  'Read_Number',  'Read_Number',  'Read_Number' ];
   m_asWrite = ['Write_Binary', 'Write_String', 'Write_String_W', 'Write_Number', 'Write_Number', 'Write_Number'];

   constructor (pSrc)
   {
      var $this = this;
      var wOffset = 0;

      $this.FIELD = MV.MVSB.MAP.FIELD;
      $this.ARRAY = MV.MVSB.MAP.ARRAY;

      var Copy = function (pDst, pSrc, wOrigin)
      {
         var Value = function (pValue, wOrigin)
         {
            let xValue = null;

            if (pValue instanceof Array  &&  typeof pValue[0] === 'number')
            {

               let xData    = pValue;

               let bType    = xData[0];
               let wBytes   = xData[1];
               let xDefault = xData[2];

               if (bType == MV.MVSB.MAP.FIELD.eTYPE.SIZE)
                  $this.m_pSize['n' + xDefault] = wOrigin + wOffset;

               if (bType > MV.MVSB.MAP.FIELD.eTYPE.PAD)
                  xValue = new $this.FIELD (bType, wBytes, wOffset - wOrigin, xDefault);

               wOffset += wBytes;
            }
            else if (pValue instanceof Array)
            {

               let xData    = pValue[0];
               let wCount   = pValue[1];
               let sCount   = pValue[2];

               let wOrigin_Array = wOffset;

               let pItem = Value (xData, wOrigin_Array);

               let wBytes = wOffset - wOrigin_Array;

               xValue = new $this.ARRAY (pItem, wOrigin_Array, wCount, wBytes, sCount);

               wOffset = wOrigin_Array + (wCount * wBytes);

               if ($this.m_pSize.nVarSize)
                  $this.m_pValue_VarSize = xValue;
            }
            else
            {

               xValue = Object.create (null);

               Copy (xValue, pValue, wOrigin);
            }

            return xValue;
         }

         for (let sProperty in pSrc)
            if (pSrc.hasOwnProperty (sProperty))
            {

               let xValue = Value (pSrc[sProperty], wOrigin);

               if (xValue)
                  pDst[sProperty] = xValue;
            }
      }

      this.m_pSize = {};

      Copy (this.m_pProperties = Object.create (null), pSrc, 0);

      if (this.m_pSize.nPartial == undefined)
         this.m_pSize.nPartial = wOffset;

      this.m_pSize.nFull = wOffset;
   }

   Size (pObj)
   {
      return this.m_pValue_VarSize ? this.m_pSize.nVarSize + (this.m_pValue_VarSize.wBytes * pObj[this.m_pValue_VarSize.sCount]) : this.m_pSize.nFull;
   }

   Init (pDst)
   {
      this.Read (null, 0, pDst)
   }

   Read (u8a, wOffset_Base, pDst)
   {
      var bResult = true;
      var $this   = this;

      var Copy = function (u8a, wOffset_Base, pDst, pProperties, wOrigin)
      {
         var Value = function (wOffset_Base, pDst, sProperty, pValue, wOrigin)
         {
            if (pValue instanceof $this.FIELD)
            {

               var field = pValue;

               if (u8a != null)
               {
                  pDst[sProperty] = MV.MVSB.ByteArray[$this.m_asRead[field.bType - MV.MVSB.MAP.FIELD.eTYPE.BINARY]] (u8a, wOffset_Base + wOrigin + field.wOffset, field.wBytes, field.bType);

               }
               else pDst[sProperty] = field.xDefault;
            }
            else if (pValue instanceof $this.ARRAY)
            {

               var wItem;
               var array = pValue;

               if (array.pItem.bType == MV.MVSB.MAP.FIELD.eTYPE.STRING
               ||  array.pItem.bType == MV.MVSB.MAP.FIELD.eTYPE.STRING_W)
               {
                  Value (wOffset_Base, pDst, sProperty, new $this.FIELD (array.pItem.bType, array.wCount * array.pItem.wBytes, array.pItem.wOffset), array.wOrigin);
               }
               else
               {
                  if (pDst[sProperty] === undefined)
                     pDst[sProperty] = [];

                  var wCount = (u8a  &&  array.sCount) ? pDst[array.sCount] : array.wCount;

                  for (wItem=0; wItem<wCount; wItem++)
                     Value (wOffset_Base + (wItem * array.wBytes), pDst[sProperty], wItem, array.pItem, array.wOrigin);

                  pDst[sProperty].length = wItem;
               }
            }
            else
            {

               if (pDst[sProperty] === undefined)
                  pDst[sProperty] = Object.create (null);

               Copy (u8a, wOffset_Base, pDst[sProperty], pValue, wOrigin);
            }
         }

         for (var sProperty in pProperties)
         {

            Value (wOffset_Base, pDst, sProperty, pProperties[sProperty], wOrigin)
         }
      }

      Copy (u8a, wOffset_Base, pDst, this.m_pProperties, 0);

      return bResult;
   }

   Write (u8a, wOffset_Base, pSrc)
   {
      var bResult = true;
      var $this   = this;

      var Copy = function (u8a, wOffset_Base, pSrc, pProperties, wOrigin)
      {
         var Value = function (wOffset_Base, pSrc, sProperty, pValue, wOrigin)
         {
            if (pValue instanceof $this.FIELD)
            {

               var field = pValue;

               if (MV.MVSB.ByteArray[$this.m_asWrite[field.bType - MV.MVSB.MAP.FIELD.eTYPE.BINARY]] (u8a, wOffset_Base + wOrigin + field.wOffset, field.wBytes, pSrc[sProperty], field.bType) == false)
                  bResult = false;
            }
            else if (pValue instanceof $this.ARRAY)
            {

               var array = pValue;

               if (array.pItem.bType == MV.MVSB.MAP.FIELD.eTYPE.STRING
               ||  array.pItem.bType == MV.MVSB.MAP.FIELD.eTYPE.STRING_W)
               {
                  Value (wOffset_Base, pSrc, sProperty, new $this.FIELD (array.pItem.bType, array.wCount * array.pItem.wBytes, array.pItem.wOffset), array.wOrigin);
               }
               else
               {
                  var wCount = array.sCount ? pSrc[array.sCount] : array.wCount;

                  for (var wItem=0; wItem<wCount; wItem++)
                     Value (wOffset_Base + (wItem * array.wBytes), pSrc[sProperty], wItem, array.pItem, array.wOrigin);

               }
            }
            else
            {

               Copy (u8a, wOffset_Base, pSrc[sProperty], pValue, wOrigin);
            }
         }

         for (var sProperty in pProperties)
         {

            Value (wOffset_Base, pSrc, sProperty, pProperties[sProperty], wOrigin)
         }
      }

      Copy (u8a, wOffset_Base, pSrc, this.m_pProperties, 0);

      return bResult;
   }
}

MV.MVSB.MAP.ARRAY = class
{
   constructor (pItem, wOrigin, wCount, wBytes, sCount)
   {
      this.pItem   = pItem;
      this.wOrigin = wOrigin;
      this.wCount  = wCount;
      this.wBytes  = wBytes;
      this.sCount  = sCount;
   }
}

MV.MVSB.MAP.FIELD = class
{
   constructor (bType, wBytes, wOffset, xDefault)
   {
      this.bType   = bType;
      this.wBytes  = wBytes;
      this.wOffset = wOffset;

      if (xDefault !== undefined)
         this.xDefault = xDefault;
   }
}

MV.MVSB.MAP.FIELD.eTYPE =
{
   SIZE            : 0,
   PAD             : 1,
   BINARY          : 2,
   STRING          : 3,
   STRING_W        : 4,
   NUMBER_UNSIGNED : 5,
   NUMBER_SIGNED   : 6,
   NUMBER_FLOAT    : 7,
};

MV.MVSB.MAP.FIELD.PAD      = function (n) { return [ MV.MVSB.MAP.FIELD.eTYPE.PAD,      n    ]; };
MV.MVSB.MAP.FIELD.BINARY   = function (n) { return [ MV.MVSB.MAP.FIELD.eTYPE.BINARY,   n    ]; };
MV.MVSB.MAP.FIELD.STRING   = function (n) { return [ MV.MVSB.MAP.FIELD.eTYPE.STRING,   n    ]; };
MV.MVSB.MAP.FIELD.STRING_W = function (n) { return [ MV.MVSB.MAP.FIELD.eTYPE.STRING_W, n * 2]; };

MV.MVSB.MAP.FIELD.BYTE     = [ MV.MVSB.MAP.FIELD.eTYPE.NUMBER_UNSIGNED, 1 ];
MV.MVSB.MAP.FIELD.WORD     = [ MV.MVSB.MAP.FIELD.eTYPE.NUMBER_UNSIGNED, 2 ];
MV.MVSB.MAP.FIELD.DWORD    = [ MV.MVSB.MAP.FIELD.eTYPE.NUMBER_UNSIGNED, 4 ];
MV.MVSB.MAP.FIELD.TWORD    = [ MV.MVSB.MAP.FIELD.eTYPE.NUMBER_UNSIGNED, 6 ];
MV.MVSB.MAP.FIELD.TWORD8   = [ MV.MVSB.MAP.FIELD.eTYPE.NUMBER_UNSIGNED, 8 ];
MV.MVSB.MAP.FIELD.QWORD    = [ MV.MVSB.MAP.FIELD.eTYPE.NUMBER_UNSIGNED, 8 ];
MV.MVSB.MAP.FIELD.CHAR     = [ MV.MVSB.MAP.FIELD.eTYPE.NUMBER_SIGNED,   1 ];
MV.MVSB.MAP.FIELD.SHORT    = [ MV.MVSB.MAP.FIELD.eTYPE.NUMBER_SIGNED,   2 ];
MV.MVSB.MAP.FIELD.INT      = [ MV.MVSB.MAP.FIELD.eTYPE.NUMBER_SIGNED,   4 ];
MV.MVSB.MAP.FIELD.TSHORT   = [ MV.MVSB.MAP.FIELD.eTYPE.NUMBER_SIGNED,   6 ];
MV.MVSB.MAP.FIELD.TSHORT8  = [ MV.MVSB.MAP.FIELD.eTYPE.NUMBER_SIGNED,   8 ];
MV.MVSB.MAP.FIELD.DINT     = [ MV.MVSB.MAP.FIELD.eTYPE.NUMBER_SIGNED,   8 ];
MV.MVSB.MAP.FIELD.FLOAT    = [ MV.MVSB.MAP.FIELD.eTYPE.NUMBER_FLOAT,    4 ];
MV.MVSB.MAP.FIELD.DOUBLE   = [ MV.MVSB.MAP.FIELD.eTYPE.NUMBER_FLOAT,    8 ];

MV.MVSB.MAP.FIELD.PERCENT  =   MV.MVSB.MAP.FIELD.INT;
MV.MVSB.MAP.FIELD.MONEY    =   MV.MVSB.MAP.FIELD.INT;
MV.MVSB.MAP.FIELD.LMONEY   =   MV.MVSB.MAP.FIELD.DINT;
MV.MVSB.MAP.FIELD.TIMEX    =   MV.MVSB.MAP.FIELD.INT;
MV.MVSB.MAP.FIELD.TIME     =   MV.MVSB.MAP.FIELD.DINT;
MV.MVSB.MAP.FIELD.EVENT    =   MV.MVSB.MAP.FIELD.QWORD;

MV.MVSB.SERVICE = class extends MV.MVMF.SERVICE
{
   static factory ()
   {
      return new this.FACTORY ('MVSB');
   }

   static eCLIENT =
   {
      CONNECTED    : 0,
      DISCONNECTED : 1,
   };

   static eTIME =
   {
      X64TH  : 0,
      SECOND : 1,
      MINUTE : 2,
      HOUR   : 3,
      DAY    : 4,
   };

   eCLIENT = MV.MVSB.SERVICE.eCLIENT;
   eTIME   = MV.MVSB.SERVICE.eTIME;

   #pNetSettings;

   constructor (pReference, pNamespace)
   {
      super (pReference, pNamespace);

      this.#pNetSettings    = pReference.pNetSettings;

      this.tmServer_Current = 0;
      this.tmServer_Last    = 0;

      this.Delta            = {
                                 bInitialize : true,
                                 txServer    : 0,
                                 nTotal      : 0,
                                 nCount      : 0,
                              };

      this.Latency          = {
                                 bInitialize : true,
                                 txServer    : 2,
                                 nTotal      : 0,
                                 nCount      : 0,
                              };

   }

   destructor ()
   {

      return null;
   }

   get pNetSettings () { return this.#pNetSettings; }

   Client_Open (twClientIx)
   {
      return super.Client_Open (MV.MVSB.SERVICE.CLIENT.Reference (twClientIx));
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

   Time_Server ()
   {
      return this.tmServer_Current;
   }

   Time_Latency (nMilliseconds)
   {

      this.Latency.nTotal += nMilliseconds;
      this.Latency.nCount += 1;
   }

   Time_Sync (tmServer)
   {
      tmServer += this.Latency.txServer;

      let tmSystem_Current = MV.MVSB.Time.Current ();

      let txDelta = tmServer - tmSystem_Current;

      this.Delta.nTotal += txDelta;
      this.Delta.nCount += 1;

      if (this.Delta.bInitialize)
      {
         this.Delta.txServer    = txDelta;
         this.Delta.bInitialize = false;

         this.tmServer_Current = tmSystem_Current + this.Delta.txServer;
      }
   }

   Exec ()
   {
      return true;
   }

   PreKill ()
   {
      this.Client_Enum
      (
         this,
         function (pClient)
         {
            pClient.SocketDisconnected (true);

            return true;
         }
      );

      return this.SafeKill ();
   }

   SafeKill ()
   {
      let bResult = false;

      let pClient = this.Client_Enum
      (
         this,
         function (pClient)
         {
            return pClient.SafeKill ();
         }
      );

      if (pClient != null)
      {
         this.Client_Release ();
      }
      else bResult = true;

      return bResult;
   }

   Kill ()
   {
      return false;
   }
}

MV.MVSB.SERVICE.FACTORY = class extends MV.MVMF.SERVICE.FACTORY
{

   Reference (sConnect)
   {
      return new MV.MVSB.SERVICE.IREFERENCE (this.sID, sConnect);
   }
}

MV.MVSB.SERVICE.IREFERENCE = class extends MV.MVMF.SERVICE.IREFERENCE
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
      return new MV.MVSB.SERVICE (this, pNamespace);
   }
}

MV.MVSB.SERVICE.ITIME = class extends MV.MVSB.TIME.ITIME
{
   Tick (tmSystem_Current)
   {

      MV.MVMF.Core.Namespace_Enum
      (
         this,
         function (pNamespace)
         {
            pNamespace.Service_Enum
            (
               'MVSB',
               this,
               function (pService)
               {
                  let c, txAverage, uCode;

                  if (pService.Latency.nCount >= 256  ||  (pService.Latency.nCount >= 4  &&  pService.Latency.bInitialize))
                  {
                     txAverage  = pService.Latency.nTotal / pService.Latency.nCount;
                     txAverage *= 64;
                     txAverage /= 1000;
                     txAverage /= 2;

                     if (pService.Latency.bInitialize)
                     {
                        pService.Latency.txServer = Math.round (txAverage);

                        if (pService.Latency.nCount >= 256)
                           pService.Latency.bInitialize = false;
                     }
                     else
                     {
                        pService.Latency.txServer = Math.round ((3 * pService.Latency.txServer + txAverage) / 4);

                        pService.Latency.nTotal = 0;
                        pService.Latency.nCount = 0;
                     }
                  }

                  if (pService.Delta.nCount >= 256  ||  (pService.Delta.nCount >= 4  &&  pService.Latency.bInitialize))
                  {
                     txAverage = pService.Delta.nTotal / pService.Delta.nCount;

                     if (pService.Latency.bInitialize)
                     {
                        pService.Delta.txServer = Math.round (txAverage);
                     }
                     else
                     {
                        pService.Delta.txServer = Math.round ((3 * pService.Delta.txServer + txAverage) / 4);

                        pService.Delta.nTotal = 0;
                        pService.Delta.nCount = 0;
                     }
                  }

                  if (pService.tmServer_Current < tmSystem_Current + pService.Delta.txServer)
                  {
                     pService.tmServer_Current = tmSystem_Current + pService.Delta.txServer;

                     if (Math.floor (pService.tmServer_Last / 0x00000040) != Math.floor (pService.tmServer_Current / 0x00000040))
                     {
                        if (Math.floor (pService.tmServer_Last / 0x00000F00) != Math.floor (pService.tmServer_Current / 0x00000F00))
                        {
                           if (Math.floor (pService.tmServer_Last / 0x00038400) != Math.floor (pService.tmServer_Current / 0x00038400))
                           {
                              if (Math.floor (pService.tmServer_Last / 0x00546000) != Math.floor (pService.tmServer_Current / 0x00546000))
                              {
                                 uCode = pService.eTIME.DAY;
                              }
                              else uCode = pService.eTIME.HOUR;
                           }
                           else uCode = pService.eTIME.MINUTE;
                        }
                        else uCode = pService.eTIME.SECOND;
                     }
                     else uCode = pService.eTIME.X64TH;

                     pService.Client_Enum
                     (
                        this,
                        function (pClient)
                        {
                           pClient.Tick (uCode, pService.tmServer_Current);

                           return true;
                        }
                     );

                     pService.tmServer_Last = pService.tmServer_Current;
                  }

                  return true;
               }
            );

            return true;
         }
      )
   }
}

/*
const WebSocketClient = require ('websocket').client;
const { Buffer }      = require ('node:buffer');
*/

MV.MVSB.NET = class
{
   static eSTATE =
   {
      NOTCONNECTED           : 0,
      CONNECTING             : 1,
      CONNECTED              : 2,
      CLOSED                 : 3,
   };

   static eRESULT =
   {
      DISCONNECT             : 0xE000,
      SOCKETCLOSE            : 0xE001,
      SOCKETERROR            : 0xE002,
      TIMEOUT                : 0xE003,
      INVALIDPACKET_HEADER   : 0xE004,
      INVALIDPACKET_REQUEST  : 0xE005,
      INVALIDPACKET_RESPONSE : 0xE006,
      INVALIDPACKET_DATA     : 0xE007,
   };

   static nTIMEOUT           = 10;

   eSTATE  = MV.MVSB.NET.eSTATE;
   eRESULT = MV.MVSB.NET.eRESULT;

   constructor (pClient, pINet)
   {
      this.pClient           = pClient;
      this.pINet             = pINet;

      this.nState            = this.eSTATE.NOTCONNECTED;
      this.pThis             = null;
      this.fnCompletion      = null;
      this.pParam            = null;
      this.dTimeout          = null;

      this.WS                = null;

      this.iTimeout          = null;

      this.aPacket           = [];
      this.twPacketIx        = 0;

      this.dwResult          = 0;
   }

   destructor ()
   {
      if (this.nState > this.eSTATE.NOTCONNECTED)
      {
         this.onClose ();
      }

      this.aPacket        = null;

      this.pINet          = null;
      this.pClient        = null;

      return null;
   }

   Timeout (nTimeout)
   {
      var dTimeout = new Date ();

      dTimeout.setTime (dTimeout.getTime () + (nTimeout * 1000));

      return dTimeout;
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
      this.dTimeout     = null;

      if (fnCompletion != null)
         fnCompletion.call (pThis, true, pParam);

      this.pINet.onConnected ();
   }

   onClose (e)
   {
      if (this.dwResult == 0)
         this.dwResult = this.eRESULT.SOCKETCLOSE;

      while (this.aPacket.length > 0)
      {
         var Packet = this.aPacket[0];

         this.aPacket.splice (0, 1);

         Packet.pIAction.dwResult = this.dwResult;
         Packet.pIAction.Response ();
         Packet.pIAction = Packet.pIAction.destructor ();
      }

      let nState       = this.nState;
      let pThis        = this.pThis;
      let fnCompletion = this.fnCompletion;
      let pParam       = this.pParam;

      clearInterval (this.iTimeout);
      this.iTimeout      = null;


      this.WS.onopen     = null;
      this.WS.onclose    = null;
      this.WS.onerror    = null;
      this.WS.onmessage  = null;

      this.WS            = null;

      this.nState        = this.eSTATE.NOTCONNECTED;
      this.pThis         = null;
      this.fnCompletion  = null;
      this.pParam        = null;
      this.dTimeout      = null;

      if (fnCompletion != null)
         fnCompletion.call (pThis, false, pParam);

      if (nState > this.eSTATE.CONNECTING)
         this.pINet.onDisconnected ();
   }

   onError (e)
   {
      this.Close (this.eRESULT.SOCKETERROR);
   }

   onMessage (arraybuffer)
   {
      let U8A        = new Uint8Array (arraybuffer);
      let ByteStream = new MV.MVSB.NET.BYTESTREAM (U8A);

      let twPacketIx = ByteStream.Read_TWORD  ();
      let wControl   = ByteStream.Read_WORD   ();
      let dwValue    = ByteStream.Read_DWORD  ();
      let wSend      = ByteStream.Read_WORD   ();
      let wError     = ByteStream.Read_WORD   ();

      let i;

      if (ByteStream.Offset () == 16)
      {
         if ((wControl & 0x0002) == 0)
         {

            if (this.pINet.onRecv_Request (twPacketIx, dwValue, wSend, ByteStream) == false)
               this.Close (this.eRESULT.INVALIDPACKET_REQUEST);
         }
         else
         {

            for (i=0; i<this.aPacket.length && this.aPacket[i].twPacketIx!=twPacketIx; i++);
            if (i < this.aPacket.length)
            {
               var pPacket = this.aPacket[i];

               this.pClient.pService.Time_Latency (performance.now () - pPacket.nTime);

               pPacket.pIAction.dwResult = dwValue;
               pPacket.pIAction.wError   = wError;
               pPacket.pIAction.ReadResponse (ByteStream);

               if (ByteStream.EOS () != false)
               {
                  this.aPacket.splice (i, 1);

                  pPacket.pIAction.Response ();
               }
               else this.Close (this.eRESULT.INVALIDPACKET_DATA);

               pPacket.pIAction = pPacket.pIAction.destructor ();
            }
            else this.Close (this.eRESULT.INVALIDPACKET_RESPONSE);
         }
      }
      else this.Close (this.eRESULT.INVALIDPACKET_HEADER);

      ByteStream.destructor ();
   }

   onTimeout ()
   {
      var i;
      var dCurrent = new Date ();

      if (this.dTimeout != null  &&  this.dTimeout <= dCurrent)
         i = -1;
      else for (i=0; i<this.aPacket.length && this.aPacket[i].dTimeout>dCurrent; i++);

      if (i < this.aPacket.length)
         this.Close (this.eRESULT.TIMEOUT);
   }

   Close (dwResult)
   {
      if (this.nState > this.eSTATE.NOTCONNECTED  &&  this.nState < this.eSTATE.CLOSED)
      {
         this.nState  = this.eSTATE.CLOSED;

         this.dwResult = dwResult;

         if (dwResult != this.eRESULT.DISCONNECT)
            console.log ('UNEXPECTED SOCKET CLOSED: (' + dwResult + ')');

         this.WS.close ();

/*
         if (this.WS_Conn)
            this.WS_Conn.close ();
*/
      }
   }

   EndPoint (bSecure, sHost, wPort)
   {
      let sProtocol = bSecure ? 'wss' : 'ws';

      return sProtocol + '://' + sHost + ':' + wPort + '/WS ';
   }

   Connect (bSecure, sHost, wPort, pThis, fnCompletion, pParam, nTimeout)
   {
      var bResult = true;
      var This = this;

      if (!nTimeout)
         nTimeout = MV.MVSB.NET.nTIMEOUT;

      if (this.nState == this.eSTATE.NOTCONNECTED)
      {
         this.pThis             = pThis;
         this.fnCompletion      = fnCompletion;
         this.pParam            = pParam;
         this.dTimeout          = this.Timeout (nTimeout);

         this.nState            = this.eSTATE.CONNECTING;


         this.WS                = new WebSocket (this.EndPoint (bSecure, sHost, wPort));
         this.WS.onopen         = function ()  { This.onOpen    ();        };
         this.WS.onclose        = function (e) { This.onClose   (e);       };
         this.WS.onerror        = function (e) { This.onError   (e);       };
         this.WS.onmessage      = function (m) { This.onMessage (m.data);  };
         this.WS.binaryType     = 'arraybuffer';

/*
         this.WS = new WebSocketClient ();
         this.WS.on ('connectFailed',  function(e) { This.onError   (e);       });
         this.WS.on ('connect',        function (connection) {
            This.WS_Conn = connection;
            connection.on ('error',   function (e) { This.onError   (e);            });
            connection.on ('close',   function ()  { This.onClose   ();             });
            connection.on ('message', function (m) { This.onMessage (m.binaryData); });
            This.onOpen ();
         });

         this.WS.connect(this.EndPoint (bSecure, sHost, wPort));
*/

         this.iTimeout         = setInterval (function () { This.onTimeout () }, 1000);

         this.twPacketIx       = 0;

         this.dwResult         = 0;
      }
      else bResult = false;

      return bResult;
   }

   Disconnect (pThis, fnCompletion, pParam, nTimeout)
   {
      var bResult = true;

      if (!nTimeout)
         nTimeout = MV.MVSB.NET.nTIMEOUT;

      if (this.nState == this.eSTATE.CONNECTED)
      {
         this.pThis        = pThis;
         this.fnCompletion = fnCompletion;
         this.pParam       = pParam;
         this.dTimeout     = this.Timeout (nTimeout);

         this.Close (this.eRESULT.DISCONNECT);
      }
      else bResult = false;

      return bResult;
   }

   Send_Request (pIAction, nTimeout)
   {
      var bResult = true;
      var ByteStream;

      if (!nTimeout)
         nTimeout = MV.MVSB.NET.nTIMEOUT;

      if (this.nState == this.eSTATE.CONNECTED)
      {
         let wSend    = pIAction.RequestSize ();
         let wControl = pIAction.bResponse ? 1 : 0;

         ByteStream = new MV.MVSB.NET.BYTESTREAM (16 + wSend);

         ByteStream.Write_TWORD (this.twPacketIx);
         ByteStream.Write_WORD  (wControl);
         ByteStream.Write_DWORD (pIAction.dwAction);
         ByteStream.Write_WORD  (wSend);
         ByteStream.Write_WORD  (0);

         pIAction.WriteRequest (ByteStream);

         if (ByteStream.EOS () != false)
         {
            if (pIAction.bResponse)
            {
               this.aPacket.push
               ({
                  twPacketIx : this.twPacketIx,
                  pIAction   : pIAction,
                  dTimeout   : this.Timeout (nTimeout),
                  nTime      : performance.now ()
               });
            }

            this.twPacketIx++;


            this.WS.send (ByteStream.buffer);

/*

            let buf = Buffer.from (ByteStream.buffer.buffer);
            this.WS_Conn.sendBytes (buf);
*/
         }
         else bResult = false;

         ByteStream = ByteStream.destructor ();
      }
      else bResult = false;

      return bResult;
   }

   Send_Response (pIAction, twPacketIx)
   {
      let bResult = true;
      let ByteStream;
      let wControl = 2;

      if (this.nState == this.eSTATE.CONNECTED)
      {
         if (pIAction.bResponse)
         {
            let wSend = pIAction.dwResult ? 0 : pIAction.ResponseSize ();

            ByteStream = new MV.MVSB.NET.BYTESTREAM (16 + wSend);

            ByteStream.Write_TWORD (twPacketIx);
            ByteStream.Write_WORD  (wControl);
            ByteStream.Write_DWORD (pIAction.dwResult);
            ByteStream.Write_WORD  (wSend);
            ByteStream.Write_WORD  (0);

            if (wSend)
               pIAction.WriteResponse (ByteStream);

            if (ByteStream.EOS () != false)
            {

               this.WS.send (ByteStream.buffer);

/*

               let buf = Buffer.from (ByteStream.buffer.buffer);
               this.WS_Conn.sendBytes (buf);
*/
            }
            else bResult = false;

            ByteStream = ByteStream.destructor ();
         }
      }
      else bResult = false;

      pIAction.destructor ();

      return bResult;
   }
}

MV.MVSB.NET.INET = class
{
   onConnected ()
   {
   }

   onDisconnected ()
   {
   }

   onRecv_Request (twPacketIx, dwAction, wSize, ByteStream)
   {
      return true;
   }
}

MV.MVSB.NET.BYTESTREAM = class
{
   constructor (x)
   {
      this.buffer = (x instanceof Uint8Array) ? x : new Uint8Array (x);
      this.offset = 0;
      this.error  = 0;
   }

   destructor ()
   {
      this.buffer = null;

      return null;
   }

   Length ()
   {
      return this.buffer.length;
   }

   Reset ()
   {
      this.offset = 0;
      this.error  = 0;
   }

   Seek (bytes)
   {
      if (this.offset + bytes >= 0  &&  this.offset + bytes <= this.buffer.length)
      {
         this.offset += bytes;
      }
      else this.error = 1;

      return (this.error == 0) ? this.offset : -1;
   }

   Remaining ()
   {
      return (this.error == 0) ? this.buffer.length - this.offset : -1;
   }

   Offset ()
   {
      return (this.error == 0) ? this.offset : -1;
   }

   EOS ()
   {
      return (this.error == 0  &&  this.offset == this.buffer.length);
   }

   Write_Pad (bytes, offset)
   {
      if (offset !== undefined)
         this.offset = offset;

      if (bytes >= 0  &&  this.offset + bytes <= this.buffer.length)
      {
         MV.MVSB.ByteArray.Clear (this.buffer, this.offset, bytes);

         this.offset += bytes;
      }
      else this.error = 1;
   }

   Write_Binary (value, bytes, offset)
   {
      let i;

      if (offset !== undefined)
         this.offset = offset;

      if (bytes >= 0  &&  this.offset + bytes <= this.buffer.length)
      {
         if (value.length <= bytes)
         {
            MV.MVSB.ByteArray.Write_Binary (this.buffer, this.offset, bytes, value);

            this.offset += bytes;
         }
         else this.error = 2;
      }
      else this.error = 1;
   }

   Write_String (value, bytes, offset)
   {
      let i;

      if (offset !== undefined)
         this.offset = offset;

      if (bytes >= 0  &&  this.offset + bytes <= this.buffer.length)
      {
         if (value.length <= bytes)
         {
            MV.MVSB.ByteArray.Write_String (this.buffer, this.offset, bytes, value);

            this.offset += bytes;
         }
         else this.error = 2;
      }
      else this.error = 1;
   }

   Write_Number (value, nType, bytes, offset)
   {
      if (offset !== undefined)
         this.offset = offset;

      MV.MVSB.ByteArray.Write_Number (this.buffer, this.offset, bytes, value, nType);

      if ((this.error = MV.MVSB.ByteArray.nError) == 0)
      {
         this.offset += MV.MVSB.ByteArray.nBytes;
      }
   }

   Write_BYTE    (value, offset) { this.Write_Number (value, MV.MVSB.MAP.FIELD.eTYPE.NUMBER_UNSIGNED, 1, offset); }
   Write_WORD    (value, offset) { this.Write_Number (value, MV.MVSB.MAP.FIELD.eTYPE.NUMBER_UNSIGNED, 2, offset); }
   Write_DWORD   (value, offset) { this.Write_Number (value, MV.MVSB.MAP.FIELD.eTYPE.NUMBER_UNSIGNED, 4, offset); }
   Write_TWORD   (value, offset) { this.Write_Number (value, MV.MVSB.MAP.FIELD.eTYPE.NUMBER_UNSIGNED, 6, offset); }
   Write_TWORD8  (value, offset) { this.Write_Number (value, MV.MVSB.MAP.FIELD.eTYPE.NUMBER_UNSIGNED, 8, offset); }
   Write_QWORD   (value, offset) { this.Write_Number (value, MV.MVSB.MAP.FIELD.eTYPE.NUMBER_UNSIGNED, 8, offset); }
   Write_CHAR    (value, offset) { this.Write_Number (value, MV.MVSB.MAP.FIELD.eTYPE.NUMBER_SIGNED,   1, offset); }
   Write_SHORT   (value, offset) { this.Write_Number (value, MV.MVSB.MAP.FIELD.eTYPE.NUMBER_SIGNED,   2, offset); }
   Write_INT     (value, offset) { this.Write_Number (value, MV.MVSB.MAP.FIELD.eTYPE.NUMBER_SIGNED,   4, offset); }
   Write_TSHORT  (value, offset) { this.Write_Number (value, MV.MVSB.MAP.FIELD.eTYPE.NUMBER_SIGNED,   6, offset); }
   Write_TSHORT8 (value, offset) { this.Write_Number (value, MV.MVSB.MAP.FIELD.eTYPE.NUMBER_SIGNED,   8, offset); }
   Write_DINT    (value, offset) { this.Write_Number (value, MV.MVSB.MAP.FIELD.eTYPE.NUMBER_SIGNED,   8, offset); }
   Write_FLOAT   (value, offset) { this.Write_Number (value, MV.MVSB.MAP.FIELD.eTYPE.NUMBER_FLOAT,    4, offset); }
   Write_DOUBLE  (value, offset) { this.Write_Number (value, MV.MVSB.MAP.FIELD.eTYPE.NUMBER_FLOAT,    8, offset); }

   Write_PERCENT (value, offset) { this.Write_INT    (value,                                             offset); }
   Write_MONEY   (value, offset) { this.Write_INT    (value,                                             offset); }
   Write_LMONEY  (value, offset) { this.Write_DINT   (value,                                             offset); }
   Write_TIMEX   (value, offset) { this.Write_INT    (value,                                             offset); }
   Write_TIME    (value, offset) { this.Write_DINT   (value,                                             offset); }
   Write_EVENT   (value, offset) { this.Write_QWORD  (value,                                             offset); }

   Read_Pad (bytes, offset)
   {
      if (offset !== undefined)
         this.offset = offset;

      if (this.offset + bytes >= 0  &&  this.offset + bytes <= this.buffer.length)
      {
         this.offset += bytes;
      }
      else this.error = 1;

      return 0;
   }

   Read_Binary (bytes, offset)
   {
      let value = null, i;

      if (offset !== undefined)
         this.offset = offset;

      if (bytes > 0  &&  this.offset + bytes <= this.buffer.length)
      {
         value = MV.MVSB.ByteArray.Read_Binary (this.buffer, this.offset, bytes);

         this.offset += bytes;
      }
      else this.error = 1;

      return value;
   }

   Read_String (bytes, offset)
   {
      let value = '', i;

      if (offset !== undefined)
         this.offset = offset;

      if (bytes > 0  &&  this.offset + bytes <= this.buffer.length)
      {
         value = MV.MVSB.ByteArray.Read_String (this.buffer, this.offset, bytes);

         this.offset += bytes;
      }
      else this.error = 1;

      return value;
   }

   Read_String_W (bytes, offset)
   {
      let value = '', i;

      if (offset !== undefined)
         this.offset = offset;

      if (bytes > 0  &&  this.offset + bytes <= this.buffer.length)
      {
         value = MV.MVSB.ByteArray.Read_String_W (this.buffer, this.offset, bytes);

         this.offset += bytes;
      }
      else this.error = 1;

      return value;
   }

   Read_Number (nType, bytes, offset)
   {
      let nResult = 0;

      if (offset !== undefined)
         this.offset = offset;

      nResult = MV.MVSB.ByteArray.Read_Number (this.buffer, this.offset, bytes, nType);

      if ((this.error = MV.MVSB.ByteArray.nError) == 0)
      {
         this.offset += MV.MVSB.ByteArray.nBytes;
      }
      else nResult = 0;

      return nResult;
   }

   Read_CHAR    (offset) { return this.Read_Number (MV.MVSB.MAP.FIELD.eTYPE.NUMBER_SIGNED,   1, offset); }
   Read_SHORT   (offset) { return this.Read_Number (MV.MVSB.MAP.FIELD.eTYPE.NUMBER_SIGNED,   2, offset); }
   Read_INT     (offset) { return this.Read_Number (MV.MVSB.MAP.FIELD.eTYPE.NUMBER_SIGNED,   4, offset); }
   Read_TSHORT  (offset) { return this.Read_Number (MV.MVSB.MAP.FIELD.eTYPE.NUMBER_SIGNED,   6, offset); }
   Read_TSHORT8 (offset) { return this.Read_Number (MV.MVSB.MAP.FIELD.eTYPE.NUMBER_SIGNED,   8, offset); }
   Read_DINT    (offset) { return this.Read_Number (MV.MVSB.MAP.FIELD.eTYPE.NUMBER_SIGNED,   8, offset); }
   Read_BYTE    (offset) { return this.Read_Number (MV.MVSB.MAP.FIELD.eTYPE.NUMBER_UNSIGNED, 1, offset); }
   Read_WORD    (offset) { return this.Read_Number (MV.MVSB.MAP.FIELD.eTYPE.NUMBER_UNSIGNED, 2, offset); }
   Read_DWORD   (offset) { return this.Read_Number (MV.MVSB.MAP.FIELD.eTYPE.NUMBER_UNSIGNED, 4, offset); }
   Read_TWORD   (offset) { return this.Read_Number (MV.MVSB.MAP.FIELD.eTYPE.NUMBER_UNSIGNED, 6, offset); }
   Read_TWORD8  (offset) { return this.Read_Number (MV.MVSB.MAP.FIELD.eTYPE.NUMBER_UNSIGNED, 8, offset); }
   Read_QWORD   (offset) { return this.Read_Number (MV.MVSB.MAP.FIELD.eTYPE.NUMBER_UNSIGNED, 8, offset); }
   Read_FLOAT   (offset) { return this.Read_Number (MV.MVSB.MAP.FIELD.eTYPE.NUMBER_FLOAT,    4, offset); }
   Read_DOUBLE  (offset) { return this.Read_Number (MV.MVSB.MAP.FIELD.eTYPE.NUMBER_FLOAT,    8, offset); }

   Read_PERCENT (offset) { return this.Read_Number (MV.MVSB.MAP.FIELD.eTYPE.NUMBER_SIGNED,   4, offset); }
   Read_MONEY   (offset) { return this.Read_Number (MV.MVSB.MAP.FIELD.eTYPE.NUMBER_SIGNED,   4, offset); }
   Read_LMONEY  (offset) { return this.Read_Number (MV.MVSB.MAP.FIELD.eTYPE.NUMBER_SIGNED,   8, offset); }
   Read_TIMEX   (offset) { return this.Read_Number (MV.MVSB.MAP.FIELD.eTYPE.NUMBER_SIGNED,   4, offset); }
   Read_TIME    (offset) { return this.Read_Number (MV.MVSB.MAP.FIELD.eTYPE.NUMBER_SIGNED,   8, offset); }
   Read_EVENT   (offset) { return this.Read_Number (MV.MVSB.MAP.FIELD.eTYPE.NUMBER_UNSIGNED, 8, offset); }

   Copy (u8a, origin, bytes, offset)
   {
      let result = false;
      let i;

      if (offset !== undefined)
         this.offset = offset;

      if (bytes >= 0  &&  this.offset + bytes <= this.buffer.length)
      {
         for (i=0; i<bytes; i++)
            u8a[origin + i] = this.buffer[this.offset++];

         result = true;
      }
      else this.error = 1;

      return result;
   }

   XCopy (u8a, origin, bytes, offset)
   {
      let result = false;
      let i;

      if (offset !== undefined)
         this.offset = offset;

      if (bytes >= 0  &&  this.offset + bytes <= this.buffer.length)
      {
         for (i=0; i<bytes; i++)
            u8a[origin + i] ^= this.buffer[this.offset++];

         result = true;
      }
      else this.error = 1;

      return result;
   }

   Inflate ()
   {
      let dwSize = -1;

      let nOffset = this.Offset ();
      let szHeader = this.Read_String (16);

      if (this.Offset () - nOffset == 16 && szHeader == '~~NO COMPRESS~~')
      {
         dwSize = this.Length () - nOffset - 16;
      }

      return dwSize;
   }
}

MV.MVSB.SERVICE.CLIENT = class extends MV.MVMF.CLIENT
{
   static sID = 'MVSB';

   static eSTATE =
   {
      SOCKETDISCONNECTED : 0,
      SOCKETCONNECTING   : 1,
      SYSTEMDISCONNECTED : 2,
      SYSTEMCONNECTING   : 3,
      LOGGEDOUT          : 4,
      LOGGING            : 5,
      LOGGEDIN           : 6,
   };

   static ePROGRESS =
   {
      SOCKETCONNECT_ATTEMPT    :  0,
      SOCKETCONNECT_RESULT     :  1,
      SOCKETDISCONNECT_ATTEMPT :  2,
      SOCKETDISCONNECT_RESULT  :  3,
      SYSTEMCONNECT_ATTEMPT    :  4,
      SYSTEMCONNECT_RESULT     :  5,
      SYSTEMDISCONNECT_ATTEMPT :  6,
      SYSTEMDISCONNECT_RESULT  :  7,
      LOGIN_ATTEMPT            :  8,
      LOGIN_RESULT             :  9,
      LOGOUT_ATTEMPT           : 10,
      LOGOUT_RESULT            : 11,
   };

   sID       = MV.MVSB.SERVICE.CLIENT.sID;
   eSTATE    = MV.MVSB.SERVICE.CLIENT.eSTATE;
   ePROGRESS = MV.MVSB.SERVICE.CLIENT.ePROGRESS;

   tmCurrent = 0;
   #aRecv  = {};

   #pRefresh;
   #pRecover;
   #pSubscription;
   #pControl;

   constructor (pReference, pService)
   {
      super (pReference, pService);

      this.tLastPing           = Date.now ();

      this.#pRecover           = new MV.MVSB.SERVICE.CLIENT.RECOVER      (this);
      this.#pRefresh           = new MV.MVSB.SERVICE.CLIENT.REFRESH      (this);
      this.#pSubscription      = new MV.MVSB.SERVICE.CLIENT.SUBSCRIPTION (this);
      this.#pControl           = new MV.MVSB.SERVICE.CLIENT.CONTROL      (this, this.pService.pNetSettings, this.#pSubscription);

      this.pINet               = new MV.MVSB.SERVICE.CLIENT.INET         (this);
      this.pNet                = new MV.MVSB.NET                         (this, this.pINet);
   }

   destructor ()
   {
      this.pINet              = null;
      this.pNet               = this.pNet.destructor ();

      this.#pControl          = this.#pControl     .destructor ();
      this.#pSubscription     = this.#pSubscription.destructor ();
      this.#pRefresh          = this.#pRefresh     .destructor ();
      this.#pRecover          = this.#pRecover     .destructor ();

      return super.destructor ();
   }

   static Reference (twClientIx)
   {
      return new MV.MVSB.SERVICE.CLIENT.IREFERENCE (twClientIx);
   }

   get sEndPoint         () { return this.#pControl.sEndPoint;             }
   get bNetConnected     () { return this.#pControl.bNetConnected;         }
   get bSystemConnected  () { return this.#pControl.bSystemConnected;      }
   get bLoggedIn         () { return this.#pControl.bLoggedIn;             }
   get pLogin            () { return this.#pControl.pLogin;                }

   SourceGet ()
   {
      return this.Source (0);
   }

   SafeKill ()
   {
      return this.#pControl.SafeKill ();
   }

   Progress (pProgress)
   {
      let pSource = this.Source (0);

      if (pSource)
         pSource.Progress (pProgress);
   }

   #Ping_Response (pIAction)
   {

   }

   Tick (uCode, tmServer)
   {

      let pSource = this.Source (1);

      if (pSource)
         pSource.Tick (uCode, tmServer);
   }

   Recv_Register (pAction, pIRecv)
   {
      this.#aRecv[pAction.dwAction] = { pAction, pIRecv };
   }

   Recv_Unregister (pAction)
   {
      delete this.#aRecv[pAction.dwAction];
   }

   onRecv_Request (twPacketIx, dwAction, wSize, ByteStream)
   {
      let bResult = false;

      if (this.#aRecv[dwAction])
      {
         let pIAction = this.Request (this.#aRecv[dwAction].pAction, true);

         pIAction.ReadRequest (ByteStream, twPacketIx);

         if (pIAction.pRequest == null  ||  ByteStream.EOS () != false)
         {
            bResult = this.#aRecv[dwAction].pIRecv.onRecv_Request (pIAction, wSize, ByteStream);
         }
         else pIAction.dwResult = 0xE009;

         if (!bResult)
            pIAction.Send_Response ();
      }

      return true;
   }

   onConnected ()
   {
      this.pService.Connected (this);
   }

   onDisconnected ()
   {
      this.SocketDisconnected (false);

      this.pService.Disconnected (this);
   }

   IsDisconnected ()
   {
      return (this.ReadyState () == this.eSTATE.SOCKETDISCONNECTED);
   }

   IsConnected ()
   {
      return (this.ReadyState () >= this.eSTATE.LOGGEDOUT);
   }

   IsLoggedOut ()
   {
      return (this.ReadyState () == this.eSTATE.LOGGEDOUT);
   }

   IsLoggedIn ()
   {
      return (this.ReadyState () == this.eSTATE.LOGGEDIN);
   }

   Time_Open ()
   {
      return this.Model_Open_Aux ('SBTime', '');
   }

   Time_Close (pTime)
   {
      return this.Model_Close_Aux (pTime);
   }

   ClearError         ()                  { return this.#pControl.ClearError         ()                                                ; }
   SetDevice          (acToken64U_Device) { return this.#pControl.SetDevice          (acToken64U_Device)                               ; }

   SocketConnect      ()                  { return this.#pControl.SocketConnect      ()                                                ; }
   SocketReconnect    ()                  { return this.#pControl.SocketReconnect    ()                                                ; }
   SocketDisconnect   ()                  { return this.#pControl.SocketDisconnect   ()                                                ; }
   SocketDisconnected (bVoluntary)        { return this.#pControl.SocketDisconnected (bVoluntary)                                      ; }
   SystemConnect      ()                  { return this.#pControl.SystemConnect      ()                                                ; }
   SystemReconnect    ()                  { return this.#pControl.SystemReconnect    ()                                                ; }
   SystemDisconnect   ()                  { return this.#pControl.SystemDisconnect   ()                                                ; }
   Login              (pParams)           { return this.#pControl.Login              (this.Source (0), pParams); }
   Logout             (pParams)           { return this.#pControl.Logout             (this.Source (0), pParams); }

   Object_Subscribe (wClass, twObjectIx)
   {
      let bResult = false;

      if (this.#pSubscription.Add (wClass, twObjectIx) != false)
      {
         this.#pSubscription.Subscribe_Aux ();

         bResult = true;
      }

      return bResult;
   }

   Object_Unsubscribe (wClass, twObjectIx)
   {
      let bResult = false;

      if (this.#pSubscription.Remove (wClass, twObjectIx) != false)
      {
         this.#pSubscription.Subscribe_Aux ();

         bResult = true;
      }

      return bResult;
   }

   Object_Reset (wClass, twObjectIx)
   {
      let bResult = false;

      if (this.#pSubscription.Reset (wClass, twObjectIx) != false)
      {
         this.#pSubscription.Subscribe_Aux ();

         bResult = true;
      }

      return bResult;
   }

   Request (pAction)
   {
      return new MV.MVSB.SERVICE.CLIENT.IACTION (this, pAction);
   }

   Time_Current ()
   {
      return MV.MVSB.Time.Current ();
   }

   Time_Server ()
   {
      return this.pService.Time_Server ();
   }

   Date_Current ()
   {
      let dtCurrent = new Date ();

      dtCurrent.setTime (MV.MVSB.Time.ToPosixTime (this.Time_Current ()));

      return dtCurrent;
   }

   Date_Server ()
   {
      let dtServer = new Date ();

      dtServer.setTime (MV.MVSB.Time.ToPosixTime (this.Time_Server ()));

      return dtServer;
   }
}

MV.MVSB.SERVICE.CLIENT.IREFERENCE = class extends MV.MVMF.SHAREDOBJECT.IREFERENCE
{
   constructor (twClientIx)
   {
      super (MV.MVSB.SERVICE.CLIENT.sID, twClientIx);
   }

   Key ()
   {
      return this.twClientIx + '';
   }

   Create (pService)
   {
      return new MV.MVSB.SERVICE.CLIENT (this, pService)
   }
}

MV.MVSB.SERVICE.CLIENT.INET = class extends MV.MVSB.NET.INET
{
   constructor (pClient)
   {
      super ();

      this.pClient = pClient;
   }

   onConnected ()
   {
      this.pClient.onConnected ();
   }

   onDisconnected ()
   {
      this.pClient.onDisconnected ();
   }

   onRecv_Request (twPacketIx, dwAction, wSize, ByteStream)
   {
      return this.pClient.onRecv_Request (twPacketIx, dwAction, wSize, ByteStream);
   }
}

MV.MVSB.SERVICE.CLIENT.ACTION = class
{
   constructor (dwAction, Map_Request, Map_Response, bResponse, fnResult, bSend)
   {
      this.dwAction     = dwAction;
      this.Map_Request  = Map_Request;
      this.Map_Response = Map_Response;
      this.bResponse    = bResponse == false ? false : true;
      this.fnResult     = fnResult;
      this.bSend        = bSend     == false ? false : true;
   }
}

MV.MVSB.SERVICE.CLIENT.IACTION = class
{
   #pClient;
   #pAction;

   #pRequest;
   #pResponse;
   #aError;

   #pThis;
   #fnResponse;
   #pParam;

   #twPacketIx;

   #dwResult;

   constructor (pClient, pAction)
   {
      this.#pClient     = pClient;
      this.#pAction     = pAction;
      this.#twPacketIx  = 0;

      this.#pRequest    = null;
      this.#pResponse   = null;
      this.#aError      = [];

      if ( this.#pAction.bSend  &&  this.#pAction.Map_Request)
         this.#pAction.Map_Request.Read (null, 0, this.#pRequest = Object.create (null));
      if (!this.#pAction.bSend  &&  this.#pAction.Map_Response)
         this.#pAction.Map_Response.Read (null, 0, this.#pResponse = Object.create (null));
   }

   destructor ()
   {
      return null;
   }

   get dwAction    ()         { return this.#pAction.dwAction;     }
   get bResponse   ()         { return this.#pAction.bResponse;   }

   get pRequest    ()         { return this.#pRequest;            }
   get pResponse   ()         { return this.#pResponse;           }
   get dwResult    ()         { return this.#dwResult;            }

   set dwResult    (dwResult) { this.#dwResult = dwResult;        }
   set wError      (wError)   { this.#aError.length = wError;     }

   Response ()
   {
      if (this.#fnResponse)
         this.#fnResponse.call (this.#pThis, this, this.#pParam);
   }

   WriteRequest (ByteStream)
   {
      this.#pAction.Map_Request.Write (ByteStream.buffer, ByteStream.offset, this.pRequest);

      ByteStream.Seek (this.#pAction.Map_Request.Size (this.pRequest));
   }

   WriteResponse (ByteStream)
   {
      if (this.#pAction.Map_Response)
      {
         this.#pAction.Map_Response.Write (ByteStream.buffer, ByteStream.offset, this.pResponse);

         ByteStream.Seek (this.#pAction.Map_Response.Size (this.pResponse));
      }
   }

   ReadRequest (ByteStream, twPacketIx)
   {
      this.#twPacketIx = twPacketIx;

      if (this.#pAction.Map_Request)
      {
         this.#pAction.Map_Request.Read (ByteStream.buffer, ByteStream.offset, this.#pRequest = Object.create (null));

         ByteStream.Seek (this.#pAction.Map_Request.Size (this.pRequest));
      }
   }

   ReadResponse (ByteStream)
   {
      if (this.#aError.length > 0)
      {
         for (let w=0; w<this.#aError.length; w++)
         {
            let dwError = ByteStream.Read_DWORD ();
            let sError  = ByteStream.Read_String (124);

            if (ByteStream.error != 0)
            {
               dwError = 0;
               sError  = 'Improperly transmitted packet.';
            }

            this.#aError[w] = { dwError, sError };
         }
      }
      else if (this.#dwResult == 0  &&  this.#pAction.Map_Response)
      {
         this.#pAction.Map_Response.Read (ByteStream.buffer, ByteStream.offset, this.#pResponse = Object.create (null));

         ByteStream.Seek (this.#pAction.Map_Response.Size (this.pResponse));
      }
   }

   RequestSize ()
   {
      return this.#pAction.Map_Request ? this.#pAction.Map_Request.Size (this.pRequest) : 0;
   }

   ResponseSize ()
   {
      return this.#pAction.Map_Response ? this.#pAction.Map_Response.Size (this.pResponse) : 0;
   }

   Send (pThis, fnResponse, pParam)
   {
      this.#pThis      = pThis;
      this.#fnResponse = fnResponse;
      this.#pParam     = pParam;

      let bResult  = false;
      let dwAction = this.#pAction.dwAction;
      let wClass   = ((dwAction) >> 16);

      if (this.#pClient.ReadyState () > this.#pClient.eSTATE.SYSTEMDISCONNECTED  ||  wClass == 1)
      {
         bResult = this.#pClient.pNet.Send_Request (this);
      }

      return bResult;
   }

   Send_Response ()
   {
      this.#pClient.pNet.Send_Response (this, this.#twPacketIx);
   }

   Abort ()
   {
   }

   GetResult ()
   {
      return (this.#pAction.fnResult ? this.#pAction.fnResult (this.#pResponse, this.#dwResult) : this.#dwResult);
   }
}

MV.MVSB.SERVICE.CLIENT.IRECV = class
{
   onRecv_Request (pIAction, wSize, ByteStream)
   {
      return false;
   }

   destructor ()
   {
      return null;
   }
}

MV.MVSB.SERVICE.CLIENT.CONTROL = class
{
   static eCONTROL =
   {
      SOCKETCONNECT                : 0x0001,
      SOCKETDISCONNECT             : 0x0002,
      SOCKETDISCONNECTED           : 0x0004,
      SOCKETDISCONNECTED_VOLUNTARY : 0x0008,
      SYSTEMCONNECT                : 0x0010,
      SYSTEMDISCONNECT             : 0x0020,
      LOGIN                        : 0x0100,
      LOGOUT                       : 0x0200,
   };

   #pClient;
   #pSubscription;

   #eSTATE;
   #ePROGRESS;
   #eCONTROL;

   #wControl;
   #wAgent;
   #bError;
   #dwResult;

   #bSecure;
   #sHost;
   #wPort;
   #bNetConnected;
   #bSocketConnected;

   #acToken64U_Device;
   #qwClientSessionIx;

   #bSystemConnected;

   #pSource;
   #pParams;
   #pLogin;
   #bLoggedIn;

   constructor (pClient, pNetSettings, pSubscription)
   {
      this.#pClient           = pClient;
      this.#pSubscription     = pSubscription;

      this.#eSTATE            = pClient.eSTATE;
      this.#ePROGRESS         = pClient.ePROGRESS;
      this.#eCONTROL          = MV.MVSB.SERVICE.CLIENT.CONTROL.eCONTROL;

      this.#wControl          = 0;
      this.#wAgent            = 0;
      this.#bError            = false;
      this.#dwResult          = 0;

      this.#bSecure           = pNetSettings.bSecure;
      this.#sHost             = pNetSettings.sHost;
      this.#wPort             = pNetSettings.wPort;
      this.#bNetConnected     = false;
      this.#bSocketConnected  = false;

      this.#acToken64U_Device = '';
      this.#qwClientSessionIx = 0;

      this.#bSystemConnected  = false;

      this.#pSource           = null;
      this.#pParams           = null;
      this.#pLogin            = null;
      this.#bLoggedIn         = false;
   }

   destructor ()
   {
      return null;
   }

   get sEndPoint         () { return this.#pClient.pNet.EndPoint (this.#bSecure, this.#sHost, this.#wPort); }
   get bNetConnected     () { return this.#bNetConnected;    }
   get bSystemConnected  () { return this.#bSystemConnected; }
   get bLoggedIn         () { return this.#bLoggedIn;        }
   get pLogin            () { return this.#pLogin;           }

   #ReadyState (nState)
   {
      return this.#pClient.ReadyState (nState);
   }

   #Progress (pProgress)
   {
      this.#pClient.Progress (pProgress);
   }

   #Request (sAction)
   {
      return this.#pClient.Request (MV.MVSB.SERVICE.CLIENT.CONTROL.#apAction[sAction]);
   }

   #SocketConnect_Attempt (bVoluntary)
   {
      let bExit = false;

      bVoluntary = (this.#bSocketConnected == false);

      if (this.#ReadyState () == this.#eSTATE.SOCKETDISCONNECTED)
      {
         this.ClearError ();

         this.#ReadyState (this.#eSTATE.SOCKETCONNECTING);

         this.#Progress ({ nProgress: this.#ePROGRESS.SOCKETCONNECT_ATTEMPT, bVoluntary });

         if (this.#pClient.pNet.Connect (this.#bSecure, this.#sHost, this.#wPort, this, this.#SocketConnect_Complete, bVoluntary) != false)
         {
            bExit = true;
         }
         else this.#dwResult = 0xFC18;

         if (bExit == false)
         {
            this.#SocketConnect_Exit (false, bVoluntary);
         }
      }

      return bExit;
   }

   #SocketConnect_Complete (bConnected, bVoluntary)
   {
      if (bConnected != false)
      {
         this.#dwResult = 0;
      }
      else this.#dwResult = 1;

      this.#SocketConnect_Exit (bConnected, bVoluntary);

      this.#Control_Release ();
   }

   #SocketConnect_Exit (bConnected, bVoluntary)
   {
      if (this.#dwResult == 0)
      {
         this.#bNetConnected = true;

         this.#bSocketConnected = true;

         this.#ReadyState (this.#eSTATE.SYSTEMDISCONNECTED);
      }
      else
      {
         this.#bError = true;

         this.#ReadyState (this.#eSTATE.SOCKETDISCONNECTED);
      }

      this.#Progress ({ nProgress: this.#ePROGRESS.SOCKETCONNECT_RESULT, bVoluntary, dwResult: this.#dwResult, bResult: !this.#bError });
   }

   #SocketDisconnect_Attempt (bVoluntary, bDisconnected)
   {
      let bExit = false;

      if (this.#ReadyState () == this.#eSTATE.SYSTEMDISCONNECTED)
      {
         this.ClearError ();

         this.#ReadyState (this.#eSTATE.SOCKETCONNECTING);

         this.#Progress ({ nProgress: this.#ePROGRESS.SOCKETDISCONNECT_ATTEMPT, bVoluntary, bDisconnected });

         if (this.#pClient.pNet.Disconnect (this, this.#SocketDisconnect_Complete, { bVoluntary, bDisconnected }) != false)
         {
            bExit = true;
         }
         else this.#dwResult = 0xFC18;

         if (bExit == false)
         {
            this.#SocketDisconnect_Exit (false, bVoluntary, bDisconnected)
         }
      }

      return bExit;
   }

   #SocketDisconnect_Complete (bConnected, pVD)
   {
      this.#dwResult = 0;

      this.#SocketDisconnect_Exit (bConnected, pVD.bVoluntary, pVD.bDisconnected);

      this.#Control_Release ();
   }

   #SocketDisconnect_Exit (bConnected, bVoluntary, bDisconnected)
   {
      this.#dwResult = 0;

      if (this.#dwResult == 0)
      {
         this.#bNetConnected = false;

         this.#bSocketConnected = (this.#bSocketConnected != false  &&  bVoluntary == false);

         this.#ReadyState (this.#eSTATE.SOCKETDISCONNECTED);
      }
      else
      {
         this.#bError = true;

         this.#ReadyState (this.#eSTATE.SYSTEMDISCONNECTED);
      }

      this.#Progress ({ nProgress: this.#ePROGRESS.SOCKETDISCONNECT_RESULT, bVoluntary, bDisconnected, dwResult: this.#dwResult, bResult: !this.#bError });
   }

   #SystemConnect_Request (bVoluntary)
   {
      let bExit = false;

      bVoluntary = (this.#bSystemConnected == false);

      if (this.#ReadyState () == this.#eSTATE.SYSTEMDISCONNECTED)
      {
         this.ClearError ();

         this.#ReadyState (this.#eSTATE.SYSTEMCONNECTING);

         this.#Progress ({ nProgress: this.#ePROGRESS.SYSTEMCONNECT_ATTEMPT, bVoluntary });

         let pIAction = this.#Request ('CONNECT');
         let pRequest = pIAction.pRequest;

         pRequest.acToken64U_Device = this.#acToken64U_Device;

         pRequest.dwVersion         = 0;

         pRequest.pFingerprint = MV.MVMF.Fingerprint;

         if (pIAction.Send (this, this.#SystemConnect_Response, bVoluntary) != false)
         {
            bExit = true;
         }
         else this.#dwResult = 0xFC18;

         if (bExit == false)
         {
            this.#SystemConnect_Exit (null, bVoluntary)
         }
      }

      return bExit;
   }

   #SystemConnect_Response (pIAction, bVoluntary)
   {
      this.#dwResult = pIAction.dwResult;

      this.#SystemConnect_Exit (pIAction, bVoluntary);

      this.#Control_Release ();
   }

   #SystemConnect_Exit (pIAction, bVoluntary)
   {
      if (this.#dwResult == 0)
      {
         this.#qwClientSessionIx = pIAction.pResponse.qwClientSessionIx;
         this.#acToken64U_Device = pIAction.pResponse.acToken64U_Device;

         this.#bSystemConnected = true;

         this.#ReadyState (this.#eSTATE.LOGGEDOUT);

         if (bVoluntary == false  &&  this.#bLoggedIn == false)
            this.#pSubscription.Subscribe_Aux ();
      }
      else
      {
         this.#bError = true;

         this.#ReadyState (this.#eSTATE.SYSTEMDISCONNECTED);
      }

      this.#Progress ({ nProgress: this.#ePROGRESS.SYSTEMCONNECT_RESULT, bVoluntary, dwResult: this.#dwResult, acToken64U_Device: this.#acToken64U_Device, bResult: !this.#bError });
   }

   #SystemDisconnect_Request (bVoluntary, bDisconnected)
   {
      let bExit = false;

      if (this.#ReadyState () == this.#eSTATE.LOGGEDOUT)
      {
         this.ClearError ();

         this.#ReadyState (this.#eSTATE.SYSTEMCONNECTING);

         this.#Progress ({ nProgress: this.#ePROGRESS.SYSTEMDISCONNECT_ATTEMPT, bVoluntary, bDisconnected });

         if (bVoluntary != false  &&  !bDisconnected)
         {
            let pIAction = this.#Request ('DISCONNECT');

            if (pIAction.Send (this, this.#SystemDisconnect_Response, { bVoluntary, bDisconnected }) != false)
            {
               bExit = true;
            }
            else this.#dwResult = 0xFC18;
         }
         else this.#dwResult = 0;

         if (bExit == false)
         {
            this.#SystemDisconnect_Exit (null, bVoluntary, bDisconnected)
         }
      }

      return bExit;
   }

   #SystemDisconnect_Response (pIAction, pVD)
   {
      this.#dwResult = pIAction.dwResult;

      this.#SystemDisconnect_Exit (pIAction, pVD.bVoluntary, pVD.bDisconnected);

      this.#Control_Release ();
   }

   #SystemDisconnect_Exit (pIAction, bVoluntary, bDisconnected)
   {
      this.#dwResult = 0;

      if (this.#dwResult == 0)
      {
         this.#bSystemConnected = (this.#bSystemConnected != false  &&  bVoluntary == false);

         this.#qwClientSessionIx = 0;

         this.#ReadyState (this.#eSTATE.SYSTEMDISCONNECTED);

         this.#pSubscription.Disconnected (bVoluntary, bDisconnected);
      }
      else
      {
         this.#bError = true;

         this.#ReadyState (this.#eSTATE.LOGGEDOUT);
      }

      this.#Progress ({ nProgress: this.#ePROGRESS.SYSTEMDISCONNECT_RESULT, bVoluntary, bDisconnected, dwResult: this.#dwResult, bResult: !this.#bError });
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
            else this.#dwResult = 0xFC18;
         }
         else this.#dwResult = 0xFC18;

         if (bExit == false)
         {
            this.#Login_Exit (null, bVoluntary)
         }
      }
      else
      {
         this.#pSource = null;
         this.#pParams = null;
      }

      return bExit;
   }

   #Login_Response (pIAction, bVoluntary)
   {
      this.#dwResult = pIAction.dwResult;

      this.#Login_Exit (pIAction, bVoluntary);

      this.#Control_Release ();
   }

   #Login_Exit (pIAction, bVoluntary)
   {
      if (pIAction  &&  this.#dwResult == 0)
      {
         if (this.#bLoggedIn == false)
         {
            this.#pLogin = this.#pSource.Login_Create ();
         }

         if (this.#pSource.Login_Response (this.#pParams, this.#pLogin, pIAction, bVoluntary) != false)
         {
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
         this.#bError = true;

         this.#ReadyState (this.#eSTATE.LOGGEDOUT);
      }

      this.#Progress ({ nProgress: this.#ePROGRESS.LOGIN_RESULT, bVoluntary, dwResult: this.#dwResult, pLogin: this.#pLogin, bResult: !this.#bError });

      if (this.#bError != false && this.#pLogin)
      {
         if (this.#bLoggedIn == false)
         {
            this.#pLogin = this.#pSource.Login_Destroy (this.#pLogin);
         }
      }

      this.#pSource = null;
      this.#pParams = null;
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
               else this.#dwResult = 0xFC18;
            }
            else this.#dwResult = 0xFC18;
         }
         else this.#dwResult = 0;

         if (bExit == false)
         {
            this.#Logout_Exit (null, bVoluntary, bDisconnected)
         }
      }
      else
      {
         this.#pSource = null;
         this.#pParams = null;
      }

      return bExit;
   }

   #Logout_Response (pIAction, pVD)
   {
      this.#dwResult = pIAction.dwResult;

      this.#Logout_Exit (pIAction, pVD.bVoluntary, pVD.bDisconnected);

      this.#Control_Release ();
   }

   #Logout_Exit (pIAction, bVoluntary, bDisconnected)
   {
      this.#dwResult = 0;

      if (this.#dwResult == 0)
      {
         if (pIAction)
         {
            this.#pSource.Logout_Response (this.#pParams, this.#pLogin, pIAction, bVoluntary, bDisconnected);
         }

         this.#bLoggedIn = (this.#bLoggedIn != false  &&  bVoluntary == false);

         if (this.#bLoggedIn == false)
         {
            this.#pLogin = this.#pSource.Login_Destroy (this.#pLogin);
         }

         this.#ReadyState (this.#eSTATE.LOGGEDOUT);
      }
      else
      {
         this.#bError = true;

         this.#ReadyState (this.#eSTATE.LOGGEDIN);
      }

      this.#Progress ({ nProgress: this.#ePROGRESS.LOGOUT_RESULT, bVoluntary, bDisconnected, dwResult: this.#dwResult, bResult: !this.#bError });

      this.#pSource   = null;
      this.#pParams   = null;
   }

   #Control_Acquire ()
   {
      let bResult = false;

      if (this.#wAgent == 0  &&  this.#wControl != 0)
      {
         this.#wAgent = this.#wControl;

         bResult = true;
      }

      return bResult;
   }

   #Control_Release ()
   {
      this.#wControl ^= this.#wAgent;

      this.#wAgent = 0;

      if (this.#wControl != 0)
      {
         setTimeout (this.#Control.bind (this), 0);
      }
   }

   #Control ()
   {
      let bExit = false;

      if (this.#Control_Acquire () != false)
      {
         if ((this.#wAgent & this.#eCONTROL.SOCKETDISCONNECTED) != 0)
         {
            if (this.#bNetConnected != false)
            {

               this.ClearError ();

               let bVoluntary = (this.#wAgent & this.#eCONTROL.SOCKETDISCONNECTED_VOLUNTARY) ? true : false;

               this.#pSource = this.#pClient.SourceGet ();
               this.#pParams = null;

                       this.#Logout_Request           (bVoluntary, true);
                       this.#SystemDisconnect_Request (bVoluntary, true);
               bExit = this.#SocketDisconnect_Attempt (bVoluntary, true);
            }
         }
         else
         {
            switch (this.#wAgent)
            {
               case this.#eCONTROL.SOCKETCONNECT:    bExit = this.#SocketConnect_Attempt    (true);        break;
               case this.#eCONTROL.SOCKETDISCONNECT: bExit = this.#SocketDisconnect_Attempt (true, false); break;
               case this.#eCONTROL.SYSTEMCONNECT:    bExit = this.#SystemConnect_Request    (true);        break;
               case this.#eCONTROL.SYSTEMDISCONNECT: bExit = this.#SystemDisconnect_Request (true, false); break;
               case this.#eCONTROL.LOGIN:            bExit = this.#Login_Request            (true);        break;
               case this.#eCONTROL.LOGOUT:           bExit = this.#Logout_Request           (true, false); break;
            }
         }

         if (bExit == false)
         {
            this.#Control_Release ();
         }
      }

      return false;
   }

   SafeKill ()
   {

      return (this.#bNetConnected == false  &&  this.#wControl == 0);
   }

   ClearError ()
   {
      let bResult = this.#bError;

      this.#bError = false;

      return bResult;
   }

   SetDevice (acToken64U_Device)
   {
      if (acToken64U_Device != null)
         this.#acToken64U_Device = acToken64U_Device;

      return true;
   }

   SocketConnect ()
   {
      let bResult = false;

      if ((this.#wControl & this.#eCONTROL.SOCKETCONNECT) == 0)
      {
         if (this.#ReadyState () == this.#eSTATE.SOCKETDISCONNECTED)
         {
            this.#wControl |= this.#eCONTROL.SOCKETCONNECT;

            this.#Control ();

            bResult = true;
         }
      }

      return bResult;
   }

   SocketReconnect ()
   {
      return this.SocketConnect ();
   }

   SocketDisconnect ()
   {
      let bResult = false;

      if ((this.#wControl & this.#eCONTROL.SOCKETDISCONNECT) == 0)
      {
         if ((this.#ReadyState () == this.#eSTATE.SYSTEMDISCONNECTED  &&   (this.#wControl                 & this.#eCONTROL.SYSTEMCONNECT) == 0)
         ||  (this.#ReadyState () == this.#eSTATE.SYSTEMDISCONNECTED  &&  ((this.#wControl ^ this.#wAgent) & this.#eCONTROL.SYSTEMCONNECT) != 0))
         {
            this.#wControl &= ~this.#eCONTROL.SYSTEMCONNECT;
            this.#wControl |=  this.#eCONTROL.SOCKETDISCONNECT;

            this.#Control ();

            bResult = true;
         }
         else if (this.#ReadyState () == this.#eSTATE.SOCKETDISCONNECTED  &&  ((this.#wControl ^ this.#wAgent) & this.#eCONTROL.SOCKETCONNECT) != 0)
         {
            this.#wControl &= ~this.#eCONTROL.SOCKETCONNECT;

            bResult = true;
         }
      }

      return bResult;
   }

   SocketDisconnected (bVoluntary)
   {
      let bResult = false;

      if ((this.#wControl & this.#eCONTROL.SOCKETDISCONNECTED) == 0)
      {
         if (this.#ReadyState () > this.#eSTATE.SOCKETDISCONNECTED)
         {
            this.#wControl |= this.#eCONTROL.SOCKETDISCONNECTED | (bVoluntary ? this.#eCONTROL.SOCKETDISCONNECTED_VOLUNTARY : 0);

            this.#Control ();

            bResult = true;
         }
      }

      return bResult;
   }

   SystemConnect ()
   {
      let bResult = false;

      if ((this.#wControl & (this.#eCONTROL.SYSTEMCONNECT | this.#eCONTROL.SOCKETDISCONNECT)) == 0)
      {
         if (this.#ReadyState () == this.#eSTATE.SYSTEMDISCONNECTED)
         {
            if (this.#bSystemConnected == false)
            {
               bResult = true;
            }
            else bResult = (this.#bSystemConnected != false);

            if (bResult != false)
            {
               this.#wControl |= this.#eCONTROL.SYSTEMCONNECT;

               this.#Control ();

               bResult = true;
            }
         }
      }

      return bResult;
   }

   SystemReconnect ()
   {
      return this.SystemConnect ();
   }

   SystemDisconnect ()
   {
      let bResult = false;

      if ((this.#wControl & this.#eCONTROL.SYSTEMDISCONNECT) == 0)
      {
         if ((this.#ReadyState () == this.#eSTATE.LOGGEDOUT  &&   (this.#wControl                 & this.#eCONTROL.LOGIN) == 0)
         ||  (this.#ReadyState () == this.#eSTATE.LOGGEDOUT  &&  ((this.#wControl ^ this.#wAgent) & this.#eCONTROL.LOGIN) != 0))
         {
            this.#wControl &= ~this.#eCONTROL.LOGIN;
            this.#wControl |=  this.#eCONTROL.SYSTEMDISCONNECT;

            this.#Control ();

            bResult = true;
         }
         else if (this.#ReadyState () == this.#eSTATE.SYSTEMDISCONNECTED  &&  ((this.#wControl ^ this.#wAgent) & this.#eCONTROL.SYSTEMCONNECT) != 0)
         {
            this.#wControl &= ~this.#eCONTROL.SYSTEMCONNECT;

            bResult = true;
         }
      }

      return bResult;
   }

   Login (pSource, pParams)
   {
      let bResult = false;

      if ((this.#wControl & (this.#eCONTROL.LOGIN | this.#eCONTROL.SYSTEMDISCONNECT)) == 0)
      {
         if (this.#ReadyState () == this.#eSTATE.LOGGEDOUT)
         {
            if (this.#bLoggedIn == false  &&  pParams      != null
            ||  this.#bLoggedIn != false  &&  this.#pLogin != null)
            {
               this.#pSource = pSource;
               this.#pParams = pParams;

               this.#wControl |= this.#eCONTROL.LOGIN;

               this.#Control ();

               bResult = true;
            }
         }
      }

      return bResult;
   }

   Logout (pSource, pParams)
   {
      let bResult = false;

      if ((this.#wControl & this.#eCONTROL.LOGOUT) == 0)
      {
         if (this.#ReadyState () == this.#eSTATE.LOGGEDIN)
         {
            this.#pSource = pSource;
            this.#pParams = pParams;

            this.#wControl |= this.#eCONTROL.LOGOUT;

            this.#Control ();

            bResult = true;
         }
         else if (this.#ReadyState () == this.#eSTATE.LOGGEDOUT  &&  ((this.#wControl ^ this.#wAgent) & this.#eCONTROL.LOGIN) != 0)
         {
            this.#pSource = null;
            this.#pParams = null;

            this.#wControl &= ~this.#eCONTROL.LOGIN;

            bResult = true;
         }
      }

      return bResult;
   }

   static #apAction =
   {
      CONNECT      : new MV.MVSB.SERVICE.CLIENT.ACTION
                     (
                        (3 | ((1) << 16)),
                        new MV.MVSB.MAP
                        ({
                           pFingerprint                  :
                           {
                              bBrowser_Brand             : MV.MVSB.MAP.FIELD.BYTE,
                              abReserved_A               : MV.MVSB.MAP.FIELD.PAD (1),
                              asBrowser_Version          : [ MV.MVSB.MAP.FIELD.SHORT, 4 ],

                              bSystem_Brand              : MV.MVSB.MAP.FIELD.BYTE,
                              bSystem_Product            : MV.MVSB.MAP.FIELD.BYTE,
                              bSystem_Type               : MV.MVSB.MAP.FIELD.BYTE,
                              abReserved_B               : MV.MVSB.MAP.FIELD.PAD (1),
                              asSystem_Version           : [ MV.MVSB.MAP.FIELD.SHORT, 2 ],

                              wScreen_Pixel_Width        : MV.MVSB.MAP.FIELD.WORD,
                              wScreen_Pixel_Height       : MV.MVSB.MAP.FIELD.WORD,
                              wScreen_Pixel_Depth        : MV.MVSB.MAP.FIELD.WORD,

                              dwHash_Fonts               : MV.MVSB.MAP.FIELD.DWORD,
                              dwHash_Plugins             : MV.MVSB.MAP.FIELD.DWORD,
                           },

                           acToken64U_Device             : MV.MVSB.MAP.FIELD.STRING (64),
                        }),
                        new MV.MVSB.MAP
                        ({
                           qwClientSessionIx             : MV.MVSB.MAP.FIELD.QWORD,

                           abCustom                      : [ MV.MVSB.MAP.FIELD.BYTE, 16 ],

                           acToken64U_Device             : MV.MVSB.MAP.FIELD.STRING (64),
                        })
                     ),

      DISCONNECT   : new MV.MVSB.SERVICE.CLIENT.ACTION
                     (
                        (4 | ((1) << 16)),
                        new MV.MVSB.MAP
                        ({
                        })
                     ),
   }
}

MV.MVSB.SERVICE.CLIENT.SUBSCRIPTION = class
{
   static eFLAG =
   {
      SUBSCRIBING   : 0x01,
      SUBSCRIBED    : 0x02,
      UNSUBSCRIBING : 0x04,
      RESET         : 0x08,
      DIRTY         : 0x40,
      DELETED       : 0x80,
   };

   eFLAG = MV.MVSB.SERVICE.CLIENT.SUBSCRIPTION.eFLAG;

   #pClient;

   #bLockCount    = 0;
   #bDirty        = 0;

   #aSubscription = [];

   constructor (pClient)
   {
      this.#pClient = pClient;

   }

   destructor ()
   {
      this.Disconnected (true);

      return null;
   }

   #Request (sAction)
   {
      return this.#pClient.Request (MV.MVSB.SERVICE.CLIENT.SUBSCRIPTION.#apAction[sAction]);
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

   #Lock ()
   {
      this.#bLockCount++;
   }

   #Unlock ()
   {
      let Subscription;
      let bSubscription;

      this.#bLockCount--;

      if (this.#bLockCount == 0  &&  this.#bDirty != 0)
      {
         for (bSubscription=0; bSubscription<this.#aSubscription.length; bSubscription++)
         {
            Subscription = this.#aSubscription[bSubscription];

            if (Subscription.nCount == 0  &&  (Subscription.bFlag & (this.eFLAG.SUBSCRIBING | this.eFLAG.SUBSCRIBED | this.eFLAG.UNSUBSCRIBING)) == 0)
            {
               this.#Delete (Subscription);

               bSubscription--;
            }
         }

         this.#bDirty = 0;

         this.Subscribe_Aux ();
      }
   }

   #DeleteEx (Subscription)
   {
      if (this.#bLockCount == 0)
      {
         this.#Delete (Subscription);
      }
      else this.#bDirty = 1;
   }

   #Objects_Response (pIAction)
   {
      let pRequest  = pIAction.pRequest;
      let pResponse = pIAction.pResponse;

      let wCount;
      let Subscription;

      if (pIAction.dwResult == 0  &&  pRequest.wCount == pResponse.wCount)
      {

            for (wCount=0; wCount<pResponse.wCount; wCount++)
            {
               Subscription = this.#Get (pRequest.aSBA_Subscribe_Ex_In[wCount].wClass, pRequest.aSBA_Subscribe_Ex_In[wCount].twObjectIx);

               switch (pRequest.aSBA_Subscribe_Ex_In[wCount].wState)
               {
                  case 0: if (pResponse.aSBA_Subscribe_Ex_Out[wCount].dwResult == 0)
                                                         {
                                                            Subscription.bFlag &= ~this.eFLAG.SUBSCRIBING;
                                                            Subscription.bFlag |=  this.eFLAG.SUBSCRIBED;
                                                         }

                                                         break;

                  case 0xFFFE:        if (pResponse.aSBA_Subscribe_Ex_Out[wCount].dwResult == 0)
                                                            Subscription.bFlag &= ~this.eFLAG.RESET;
                                                         break;

                  case 0xFFFF:
                                                         {
                                                            Subscription.bFlag &= ~this.eFLAG.UNSUBSCRIBING;
                                                            Subscription.bFlag &= ~this.eFLAG.SUBSCRIBED;

                                                            if (Subscription.nCount == 0  &&  (Subscription.bFlag & (this.eFLAG.SUBSCRIBING | this.eFLAG.SUBSCRIBED | this.eFLAG.UNSUBSCRIBING)) == 0)
                                                            {
                                                               this.#DeleteEx (Subscription);
                                                            }
                                                         }
                                                         break;
               }
            }

      }
   }

   Add (wClass, twObjectIx)
   {
      let bResult = false;
      let Subscription;

         if ((Subscription = this.#Get (wClass, twObjectIx)) == null)
         {
            if (this.#aSubscription.length < 64)
            {
               Subscription = this.#Insert (wClass, twObjectIx);
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

               if (Subscription.nCount == 0  &&  (Subscription.bFlag & (this.eFLAG.SUBSCRIBING | this.eFLAG.SUBSCRIBED | this.eFLAG.UNSUBSCRIBING)) == 0)
               {
                  this.#DeleteEx (Subscription);
               }

               bResult = true;
            }
         }

      return bResult;
   }

   Reset (wClass, twObjectIx)
   {
      let bResult = false;
      let Subscription;

         if ((Subscription = this.#Get (wClass, twObjectIx)) != null)
         {
            Subscription.bFlag |= this.eFLAG.RESET;

            bResult = true;
         }

      return bResult;
   }

   Disconnected (bVoluntary, bDisconnected)
   {
      let bSubscription;
      let Subscription;

         for (bSubscription=0; bSubscription<this.#aSubscription.length; bSubscription++)
         {
            Subscription = this.#aSubscription[bSubscription];

            if ((Subscription.bFlag & this.eFLAG.UNSUBSCRIBING) != 0)
            {
               Subscription.bFlag &= ~this.eFLAG.UNSUBSCRIBING;
               Subscription.bFlag &= ~this.eFLAG.SUBSCRIBED;

               if (Subscription.nCount == 0  &&  (Subscription.bFlag & (this.eFLAG.SUBSCRIBING | this.eFLAG.SUBSCRIBED | this.eFLAG.UNSUBSCRIBING)) == 0)
               {
                  this.#DeleteEx (Subscription);
               }
               else Subscription.bFlag = 0;
            }
            else Subscription.bFlag = 0;

         }

         if (bVoluntary == false)
            this.#pClient.pMem.Object_Expire_All ();
         else this.#pClient.pMem.Object_Delete_All ();

   }

   Subscribe_Aux ()
   {
      let bSubscription;
      let Subscription;
      let aSBA_Subscribe_Ex_In = [];
      let SBA_Subscribe_Ex_In;
      let wState;

         for (bSubscription=0; bSubscription<this.#aSubscription.length; bSubscription++)
         {
            Subscription = this.#aSubscription[bSubscription];

            wState = 17;

            if (Subscription.nCount > 0)
            {
               if ((Subscription.bFlag & (this.eFLAG.SUBSCRIBED | this.eFLAG.SUBSCRIBING)) == 0
               ||  (Subscription.bFlag & this.eFLAG.UNSUBSCRIBING) != 0)
               {
                  Subscription.bFlag &= ~this.eFLAG.UNSUBSCRIBING;
                  Subscription.bFlag |=  this.eFLAG.SUBSCRIBING;

                  wState = 0;
               }
               else if ((Subscription.bFlag & this.eFLAG.RESET) != 0)
                  wState = 0xFFFE;
            }
            else
            {
               if ((Subscription.bFlag & (this.eFLAG.SUBSCRIBED | this.eFLAG.UNSUBSCRIBING)) == this.eFLAG.SUBSCRIBED
               ||  (Subscription.bFlag & this.eFLAG.SUBSCRIBING) != 0)
               {
                  Subscription.bFlag &= ~this.eFLAG.SUBSCRIBING;
                  Subscription.bFlag |=  this.eFLAG.UNSUBSCRIBING;

                  wState = 0xFFFF;
               }
            }

            if (wState != 17)
            {
               SBA_Subscribe_Ex_In =
               {
                  wState:     wState,
                  wClass:     Subscription.wClass,
                  twObjectIx: Subscription.twObjectIx
               };

               aSBA_Subscribe_Ex_In.push (SBA_Subscribe_Ex_In);
            }
         }

      if (aSBA_Subscribe_Ex_In.length > 0)
      {
         let pIAction = this.#Request ('SUBSCRIBE');
         let pRequest = pIAction.pRequest;

         pRequest.wCount = aSBA_Subscribe_Ex_In.length;

         for (let i=0; i<aSBA_Subscribe_Ex_In.length; i++)
         {
            pRequest.aSBA_Subscribe_Ex_In[i].wState     = aSBA_Subscribe_Ex_In[i].wState;
            pRequest.aSBA_Subscribe_Ex_In[i].wClass     = aSBA_Subscribe_Ex_In[i].wClass;
            pRequest.aSBA_Subscribe_Ex_In[i].twObjectIx = aSBA_Subscribe_Ex_In[i].twObjectIx;
         }

         if (pIAction.Send (this, this.#Objects_Response) == false)
            pIAction.dwResult = 0xFC18;
      }
   }

   static #apAction =
   {
      SUBSCRIBE : new MV.MVSB.SERVICE.CLIENT.ACTION
      (
         (5 | ((1) << 16)),
         new MV.MVSB.MAP
         ({
            wCount                     : MV.MVSB.MAP.FIELD.WORD,
            abReserved_A               : MV.MVSB.MAP.FIELD.PAD (2),

                                         wSize_VarSize: [MV.MVSB.MAP.FIELD.eTYPE.SIZE, 0, "VarSize"],

            aSBA_Subscribe_Ex_In       :
            [
               {
                  wState               : MV.MVSB.MAP.FIELD.WORD,
                  abReserved_A         : MV.MVSB.MAP.FIELD.PAD (6),
                  twObjectIx           : MV.MVSB.MAP.FIELD.TWORD,
                  wClass               : MV.MVSB.MAP.FIELD.WORD,
               },
               256,
               "wCount"
            ]
         }),
         new MV.MVSB.MAP
         ({
            wCount                     : MV.MVSB.MAP.FIELD.WORD,
            abReserved_A               : MV.MVSB.MAP.FIELD.PAD (2),

                                         wSize_VarSize: [MV.MVSB.MAP.FIELD.eTYPE.SIZE, 0, "VarSize"],

            aSBA_Subscribe_Ex_Out      :
            [
               {
                  dwResult             : MV.MVSB.MAP.FIELD.DWORD,
               },
               256,
               "wCount"
            ]
         })
      ),
   }
}

MV.MVSB.SERVICE.CLIENT.RECOVER = class extends MV.MVSB.SERVICE.CLIENT.IRECV
{
   #pClient;

   #pObjectHead;

   pAction = new MV.MVSB.SERVICE.CLIENT.ACTION
   (
      (7 | ((1) << 16)),
      null,
      null,
      false,
      null,
      false
   );

   constructor (pClient)
   {
      super ();

      this.#pClient = pClient;

      this.#pObjectHead = new MV.MVSB.SB_OBJECT.OBJECTHEAD ();

      this.#pClient.Recv_Register (this.pAction, this);
   }

   destructor ()
   {
      this.#pClient.Recv_Unregister (this.pAction);

      this.#pObjectHead = this.#pObjectHead.destructor ();

      return super.destructor ();
   }

   Object_Recover (wClass, ByteStream, wSize)
   {
      let wRead = 0;
      let offset;

      offset = ByteStream.Offset ();

      this.#pObjectHead.twParentIx    = ByteStream.Read_TWORD ();
      this.#pObjectHead.wClass_Parent = ByteStream.Read_WORD  ();
      this.#pObjectHead.twObjectIx    = ByteStream.Read_TWORD ();
      this.#pObjectHead.wClass_Object = ByteStream.Read_WORD  ();
      this.#pObjectHead.twEventIz     = ByteStream.Read_TWORD ();
      this.#pObjectHead.wFlags        = ByteStream.Read_WORD  ();

      if (ByteStream.error == 0  &&  ByteStream.Offset () - offset == 24)
      {
         if (this.#pObjectHead.wClass_Object == wClass)
         {
            this.#pClient.pMem.Object_Update
            (
               this.#pObjectHead,
               this,
               function (pObject, bDiscard)
               {
                  pObject.Map_Write (ByteStream, this.#pObjectHead.wFlags, bDiscard);

                  return true;
               }
            );

            wRead = ByteStream.Offset () - offset;
         }
      }

      return wRead;
   }

   onRecv_Request (pIAction, wSize, ByteStream)
   {
      let dwSize, wCount;
      let w, wSize_Ex;
      let pObject;

      pIAction.dwResult = 1;
      if (wSize == ByteStream.Remaining ()  &&  (dwSize = ByteStream.Inflate ()) >= 0)
      {

         if (4 <= dwSize)
         {
            let SBA_SRI =
            {
               wCount : ByteStream.Read_WORD (),
               wSize  : ByteStream.Read_WORD (),
            };

            if (dwSize == 4 + SBA_SRI.wSize)
            {

               for (w=0, wSize=0; w<SBA_SRI.wCount && wSize<SBA_SRI.wSize; w++)
               {

                  if (wSize + 16 <= SBA_SRI.wSize)
                  {
                     let SBA_SRBI =
                     {
                        twObjectIx    : ByteStream.Read_TWORD (),
                        wClass        : ByteStream.Read_WORD  (),
                        pad           : ByteStream.Read_Pad  (3),
                        bFlags        : ByteStream.Read_BYTE  (),
                        wClass_Child  : ByteStream.Read_WORD  (),
                        wSize         : ByteStream.Read_WORD  (),
                     }

                     if (wSize + 16 + SBA_SRBI.wSize <= SBA_SRI.wSize)
                     {
                        if ((pObject = (this.#pClient.pMem.ObjectBank (SBA_SRBI.wClass)).Get (null, SBA_SRBI.twObjectIx)) != null)
                        {
                           if ((SBA_SRBI.bFlags & 0x01) != 0)
                           {

                              this.#pClient.pMem.Object_Expire_Full (pObject);
                           }

                           if ((SBA_SRBI.bFlags & 0x04) != 0  &&  SBA_SRBI.wClass_Child != 0)
                           {

                           }

                           wSize_Ex = 0;

                           if (SBA_SRBI.wClass_Child == 0)
                           {

                              wSize_Ex += this.Object_Recover (SBA_SRBI.wClass, ByteStream, SBA_SRBI.wSize - wSize_Ex);
                           }
                           else
                           {

                              if (wSize_Ex + 8 <= SBA_SRBI.wSize)
                              {
                                 let SBA_SRC =
                                 {
                                    twChildIx : ByteStream.Read_TWORD (),
                                    wCount    : ByteStream.Read_WORD  (),
                                 }

                                 wSize_Ex += 8;

                                 for (wCount=0; wCount<SBA_SRC.wCount; wCount++)
                                 {

                                    wSize_Ex += this.Object_Recover (SBA_SRBI.wClass_Child, ByteStream, SBA_SRBI.wSize - wSize_Ex);
                                 }
                              }
                           }

                           if (wSize_Ex == SBA_SRBI.wSize)
                              wSize += 16 + SBA_SRBI.wSize;
                           else wSize = SBA_SRI.wSize + 1;

                           if ((SBA_SRBI.bFlags & 0x08) != 0  &&  SBA_SRBI.wClass_Child != 0)
                           {

                           }

                           if ((SBA_SRBI.bFlags & 0x02) != 0)
                           {
                              this.#pClient.pMem.Object_Purge_Full (pObject);

                           }
                        }
                        else w = SBA_SRI.wCount-1 + 3;
                     }
                     else w = SBA_SRI.wCount-1 + 2;
                  }
                  else w = SBA_SRI.wCount-1 + 1;
               }

               if (w == SBA_SRI.wCount  &&  wSize == SBA_SRI.wSize)
                  pIAction.dwResult = 0;

            }
         }
      }

      if (pIAction.dwResult != 0)
      {

      }

      return false;
   }
}

MV.MVSB.SERVICE.CLIENT.REFRESH = class extends MV.MVSB.SERVICE.CLIENT.IRECV
{
   #pClient;

   #pSBA_SRE;

   pAction = new MV.MVSB.SERVICE.CLIENT.ACTION
   (
      (6 | ((1) << 16)),
      null,
      null,
      false,
      null,
      false
   );

   constructor (pClient)
   {
      super ();

      this.#pClient = pClient;

      this.#pSBA_SRE = {};

      this.#pClient.Recv_Register (this.pAction, this);
   }

   destructor ()
   {
      this.#pClient.Recv_Unregister (this.pAction);

      this.#pSBA_SRE = null;

      return super.destructor ();
   }

   #Event_Refresh_Object (pObject, ByteStream)
   {
      let wCount, wSize, wOffset, wLength, w;

      wCount = ByteStream.Read_WORD ();
      wSize  = ByteStream.Read_WORD ();

      for (w=0; w<wCount; w++)
      {
         wOffset = ByteStream.Read_WORD ();
         wLength = ByteStream.Read_WORD ();

         ByteStream.XCopy (pObject.bData, wOffset, wLength);
      }

      return wSize + 4;
   }

   #Event_Refresh (tmBase, ByteStream)
   {
      let wSize = 0;
      let bResult;

      let SBA_SREE =
      {
         bFlags        : ByteStream.Read_BYTE  (),
         pad           : ByteStream.Read_Pad  (5),
         wClass        : ByteStream.Read_WORD  (),
         twChildIx     : ByteStream.Read_TWORD (),
         wClass_Child  : ByteStream.Read_WORD  (),
      };

      bResult = this.#pClient.pMem.Object_Change
      (
         SBA_SREE.wClass,
         this.#pSBA_SRE.twObjectIx,
         SBA_SREE.wClass_Child,
         SBA_SREE.twChildIx,
         SBA_SREE.bFlags,
         this.#pSBA_SRE,
         this,
         function (pParent, pObject, pChild)
         {
            let wSeek;

            this.#pClient.tmCurrent = tmBase + this.#pSBA_SRE.txStamp;

            {
               pObject.pObjectHead.twEventIz = this.#pSBA_SRE.twEventIz + 1;

               if (SBA_SREE.wClass_Child != 0  &&  (SBA_SREE.bFlags & 0x04) != 0  &&  pChild != null)
               {
                  pChild.pObjectHead.twEventIz = 0;

                  for (i=0; i<pChild.bData.length; i++)
                     pChild.bData[i] = 0;
               }

               if (true)
                  this.#Event_Refresh_Object (pObject, ByteStream);
               if (SBA_SREE.wClass_Child != 0)
               {
                  if (pChild != null)
                     this.#Event_Refresh_Object (pChild, ByteStream);
                  else
                  {
                             ByteStream.Read_WORD ();
                     wSeek = ByteStream.Read_WORD ();

                     ByteStream.Seek (wSeek);
                  }
               }
               if ((SBA_SREE.bFlags & 0x08) != 0)
               {

                  wSeek = ByteStream.Read_WORD ();

                  this.#pSBA_SRE.pData = new Uint8Array (wSeek);

                  ByteStream.Copy (this.#pSBA_SRE.pData, 0, wSeek);
               }

               wSize = this.#pSBA_SRE.wSize;

            }

            return true;
         }
      );

      if (bResult == false)
      {
         ByteStream.Seek (this.#pSBA_SRE.wSize - 16);

         wSize = this.#pSBA_SRE.wSize;
      }

      return wSize;
   }

   onRecv_Request (pIAction, wSize, ByteStream)
   {
      let wSize_Ex, w;
      let dwSize;

      pIAction.dwResult = 1;
      if (wSize == ByteStream.Remaining ()  &&  (dwSize = ByteStream.Inflate ()) >= 0)
      {

         if (dwSize >= 24)
         {
            let SBA_SRI =
            {
               wCount   : ByteStream.Read_WORD  (),
               wSize    : ByteStream.Read_WORD  (),
               dwResult : ByteStream.Read_DWORD (),
               tmBase   : ByteStream.Read_TIME  (),
               evNext   : ByteStream.Read_EVENT (),
            };

            if (dwSize == 24 + SBA_SRI.wSize)
            {
               this.#pClient.pService.Time_Sync (SBA_SRI.tmBase);

               for (w=0, wSize=0; w<SBA_SRI.wCount && wSize<SBA_SRI.wSize; w++)
               {

                  if (wSize + 24 + 16 <= SBA_SRI.wSize)
                  {
                     this.#pSBA_SRE.twObjectIx   = ByteStream.Read_TWORD  ();
                     this.#pSBA_SRE.wClass       = ByteStream.Read_WORD   ();
                     this.#pSBA_SRE.twEventIz    = ByteStream.Read_TWORD8 ();
                     this.#pSBA_SRE.wEventTypeIx = ByteStream.Read_WORD   ();
                     this.#pSBA_SRE.wSize        = ByteStream.Read_WORD   ();
                     this.#pSBA_SRE.txStamp      = ByteStream.Read_TIMEX  ();
                     this.#pSBA_SRE.pData        = null;

                     if (wSize + 24 + this.#pSBA_SRE.wSize <= SBA_SRI.wSize)
                     {

                        wSize_Ex = this.#Event_Refresh (SBA_SRI.tmBase, ByteStream);

                        if (wSize_Ex == this.#pSBA_SRE.wSize)
                           wSize += 24 + this.#pSBA_SRE.wSize;
                        else wSize = SBA_SRI.wSize + 1;
                     }
                     else w = SBA_SRI.wCount;
                  }
                  else w = SBA_SRI.wCount;
               }

               if (w == SBA_SRI.wCount  &&  wSize == SBA_SRI.wSize)
                  pIAction.dwResult = 0;

            }
         }
      }

      if (pIAction.dwResult != 0)
      {

      }

      return false;
   }
}

MV.MVSB.SB_SESSION = class extends MV.MVMF.SOURCE_SESSION
{
   static asProgress =
   [
      "SOCKETCONNECT_ATTEMPT",
      "SOCKETCONNECT_RESULT",
      "SOCKETDISCONNECT_ATTEMPT",
      "SOCKETDISCONNECT_RESULT",
      "SYSTEMCONNECT_ATTEMPT",
      "SYSTEMCONNECT_RESULT",
      "SYSTEMDISCONNECT_ATTEMPT",
      "SYSTEMDISCONNECT_RESULT",
      "LOGIN_ATTEMPT",
      "LOGIN_RESULT",
      "LOGOUT_ATTEMPT",
      "LOGOUT_RESULT",
   ];

   asProgress = MV.MVSB.SB_SESSION.asProgress;

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

   get pLogin () { return this.pClient.pLogin;    }

   #Reconnect (nReconnect)
   {
      if (nReconnect != undefined)
         this.nReconnect = nReconnect;
      else if (this.nReconnect == 0)
         this.nReconnect = 1;
      else if (this.nReconnect < 64)
         this.nReconnect *= 2;

      let nDelay = (this.nReconnect * 1000) + Math.floor (Math.random () * 2000)

   console.log ('attempt reconnect in ' + (nDelay / 1000) + ' seconds from: ', Date.now ());
      setTimeout (this.pClient.SocketReconnect.bind (this.pClient), nDelay);
   }

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
                  this.pClient.SystemConnect ();
               }
               else this.pClient.SystemReconnect ();
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

         case this.pClient.ePROGRESS.SYSTEMCONNECT_RESULT:
            if (pProgress.bResult != false)
            {
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
            else ;
            break;

         case this.pClient.ePROGRESS.SYSTEMDISCONNECT_RESULT:
            if (pProgress.bResult != false)
            {
               if (pProgress.bVoluntary != false)
               {
               }
               else if (this.pClient.bLoggedIn == false)
               {

               }
            }
            break;

         case this.pClient.ePROGRESS.LOGIN_RESULT:
            if (pProgress.bResult != false)
            {
               if (pProgress.bVoluntary == false)
               {

               }
            }
            else
            {
               if (this.pClient.bLoggedIn != false)
               {

               }
            }
            break;

         case this.pClient.ePROGRESS.LOGOUT_RESULT:
            if (pProgress.bResult != false)
            {
               if (pProgress.bVoluntary == false)
               {

               }
            }
            break;
      }
   }

   LoggedOut ()
   {
      console.log ('LOGGEDOUT');

      this.pModel.LoggedOut ();
   }

   Attach ()
   {
      super.Attach ();

      if (this.bAutoConnect)
         this.Connect ()

      return true;
   }

   Detach ()
   {
      if (this.bAutoConnect)
         this.Disconnect (false);

      super.Detach ();

      return true;
   }

   Connect ()
   {
      return this.pClient.SocketConnect ();
   }

   Disconnect (bVoluntary)
   {
      return this.pClient.SocketDisconnected (bVoluntary);
   }
}

MV.MVSB.SB_SESSION.FACTORY = class extends MV.MVMF.SOURCE_SESSION.FACTORY
{
   constructor (sID_Service, sID_Model, apAction)
   {
      super (sID_Service, sID_Model, 0, apAction);
   }
}

MV.MVSB.SB_OBJECT = class extends MV.MVMF.MEM.SOURCE
{
   constructor (pReference, pMap, pClient)
   {
      super (pReference, pClient, new MV.MVSB.SB_OBJECT.OBJECTHEAD ());

      this.pMap                 = pMap;

      this.aBuffer              = this.pMap ? new ArrayBuffer (this.pMap.m_pSize.nFull) : null;
      this.bData                = this.pMap ? new Uint8Array  (this.aBuffer)            : null;
   }

   destructor ()
   {
      this.bData                = null;
      this.aBuffer              = null;

      return super.destructor ();
   }

   get twEventIz  () { return this.pObjectHead.twEventIz;  }
   get twObjectIx () { return this.pObjectHead.twObjectIx; }
   get twParentIx () { return this.pObjectHead.twParentIx; }

   Map_Read (pModel)
   {
      this.pMap.Read (this.bData, 0, pModel);
   }

   Map_Write (ByteStream, wFlags, bDiscard)
   {
      if (bDiscard)
         ;

      ByteStream.Copy (this.bData, 0, (wFlags & 0x0010) != 0 ? this.pMap.m_pSize.nPartial : this.pMap.m_pSize.nFull);
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

      if (this.bIndependent != false)
      {
         this.pClient.Object_Subscribe (this.wClass, this.pObjectHead.twObjectIx);

         bResult = true;
      }

      return bResult;
   }

   Detach ()
   {
      let bResult = false;

      if (this.bIndependent != false)
      {
         this.pClient.Object_Unsubscribe (this.wClass, this.pObjectHead.twObjectIx);

         bResult = true;
      }

      super.Detach ();

      return bResult;
   }
}

MV.MVSB.SB_OBJECT.FACTORY = class extends MV.MVMF.MEM.SOURCE.FACTORY
{
   constructor (sID_Service, sID_Model, wClass, apAction, bIndependent, pMap)
   {
      super (sID_Service, sID_Model, wClass, apAction, bIndependent);

      this.pMap = pMap;
   }
}

MV.MVSB.SB_OBJECT.OBJECTHEAD = class extends MV.MVMF.MEM.SOURCE.OBJECTHEAD
{
   constructor (twParentIx, twObjectIx, wClass_Parent, wClass_Object, wFlags, twEventIz)
   {
      super (twParentIx, twObjectIx, wClass_Parent, wClass_Object, wFlags);

      this.twEventIz = twEventIz;
   }
}

MV.MVSB.SB_SESSION_NULL = class extends MV.MVSB.SB_SESSION
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVSB',
         'Session_Null',

         MV.MVSB.SB_SESSION_NULL.apAction
      );
   }

   Progress (pProgress)
   {
      super.Progress (pProgress);

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

   Login ()
   {
      return false;
   }

   Logout ()
   {
      return false;
   }
}

MV.MVSB.SB_SESSION_NULL.FACTORY = class extends MV.MVSB.SB_SESSION.FACTORY
{

   Create (pClient)
   {
      return new MV.MVSB.SB_SESSION_NULL (this.pReference, pClient);
   }
}

MV.MVSB.SB_SESSION_NULL.apAction =
{
   NULL              :  new MV.MVSB.SERVICE.CLIENT.ACTION
                        (
                           (1 | ((1) << 16)),
                           new MV.MVSB.MAP
                           ({
                           })
                        )
};

MV.MVSB.SB_SBTIME = class extends MV.MVMF.SOURCE
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVSB',
         'SBTime',

         1,

         MV.MVSB.SB_SBTIME.apAction
      );
   }

   Tick (uCode, tmServer)
   {
      this.pModel.Tick (uCode, tmServer);
   }
}

MV.MVSB.SB_SBTIME.FACTORY = class extends MV.MVMF.SOURCE.FACTORY
{

   get bType () { return this.eTYPE.OTHER; }

   Create (pClient)
   {
      return new MV.MVSB.SB_SBTIME (this.pReference, pClient);
   }
}

MV.MVSB.SB_SBTIME.apAction =
{
};

MV.MVSB.SBTIME = class extends MV.MVMF.MODEL
{
   static factory ()
   {
      return new this.FACTORY ('SBTime');
   }

   constructor (pReference, pSource)
   {
      super (pReference, pSource);
   }

   Tick (uCode, tmServer)
   {
      this.Emit ('onTick', { uCode: uCode, tmServer: tmServer });
   }
}

MV.MVSB.SBTIME.FACTORY = class extends MV.MVMF.MODEL.FACTORY
{

   Reference (aArgs)
   {
      return new MV.MVSB.SBTIME.IREFERENCE (this.sID);
   }
}

MV.MVSB.SBTIME.IREFERENCE = class extends MV.MVMF.SHAREDOBJECT.IREFERENCE
{

   Key ()
   {
      return 1 + '';
   }

   Create (pSource)
   {
      return new MV.MVSB.SBTIME (this, pSource);
   }
}

MV.MVSB.Enum.Object =
{

};

MV.MVSB.Enum.Event =
{

};

MV.MVSB.Enum.Action =
{

};

MV.MVSB.Enum.Mem =
{

};

MV.MVSB.Enum.System =
{

};

MV.MVSB.Install = function (pCore, pPlugin)
{
   let bResult = true;

   if (this.pRequire = pCore.Require ('MVMF'))
   {
      this.apFactory_Service =
      [
         MV.MVSB.SERVICE        .factory (),
      ];

      this.apFactory_Model =
      [
         MV.MVSB.SBTIME         .factory (),
      ];

      this.apFactory_Source =
      [
         MV.MVSB.SB_SESSION_NULL.factory (),

         MV.MVSB.SB_SBTIME      .factory (),
      ];

      pPlugin.Factory_Services (this.apFactory_Service);
      pPlugin.Factory_Models   (this.apFactory_Model);
      pPlugin.Factory_Sources  (this.apFactory_Source);

      this.pITime = new MV.MVSB.SERVICE.ITIME ();
      MV.MVSB.Time = new MV.MVSB.TIME (this.pITime);
   }
   else bResult = false;

   return bResult;
}

MV.MVSB.Unstall = function (pCore, pPlugin)
{
   let n;

   if (this.pRequire)
   {
      MV.MVSB.Time = MV.MVSB.Time.destructor ();
      this.pITime = this.pITime.destructor ();

      for (n=0; n<this.apFactory_Service.length; n++)
         this.apFactory_Service[n] = this.apFactory_Service[n].destructor ();

      for (n=0; n<this.apFactory_Model.length; n++)
         this.apFactory_Model[n] = this.apFactory_Model[n].destructor ();

      for (n=0; n<this.apFactory_Source.length; n++)
         this.apFactory_Source[n] = this.apFactory_Source[n].destructor ();

      this.pRequire = pCore.Release (this.pRequire);
   }
}

MV.MVSB.Timeout = function (nTimeout) { MV.MVSB.NET.nTIMEOUT = nTimeout; }
MV.MVSB.Error   = function (dwResult) { console.log ('Class = ' + (dwResult >> 6) + ', Error = ' + (dwResult % 64)); }

MV.MVSB.Log = function (sLog)
{
   console.log (sLog);

   if (typeof document !== 'undefined')
   {
      const myElement = document.getElementById ('bugaboo');
      if (myElement != null)
      {
         myElement.classList.add ('show');
         const p = document.createElement ('p');
         p.textContent = sLog;
         myElement.appendChild (p);
      }
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

