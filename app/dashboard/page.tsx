{\rtf1\ansi\ansicpg1252\cocoartf2865
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 import \{ SignedIn, SignedOut, RedirectToSignIn \} from "@clerk/nextjs";\
\
export default function Dashboard() \{\
  return (\
    <>\
      <SignedOut>\
        <RedirectToSignIn />\
      </SignedOut>\
\
      <SignedIn>\
        <main className="p-8">\
          <h1 className="text-2xl font-semibold">Dashboard</h1>\
          <p className="mt-2">You\'92re signed in. This is your dashboard.</p>\
        </main>\
      </SignedIn>\
    </>\
  );\
\}}