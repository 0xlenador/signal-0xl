<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Todo parte desde contracts\Signal0xL.sol

El smart contract Signal0xL.sol es el que esta desplegado, nunca dudar de él, cuando algo falle en la aplicacion, analiza el smart contract, pero es de solo lectura, nunca modificar, usamos otros entornos para segurarnos de que funcione correcto, asi que tu solo lo estudiaras cuando necesites implementar, auditar, comprender, modificar y/o proponer nuevas funciones.

# Fundamentos y mis notas

El archivo Docs\my_thoughts.md es como se ideo el plan para desplegar el contrato inteligente Signal0xL.sol, luego se desplego el contrato inteligente y de alli obtenemos los fundamentos aqui: Docs\fundamentals.md. el contrato ya esta desplegado y funcionando asi que es el centro y motor de nuestra dapp.

# Ingenieria de software de primer nivel

Nada de deuda tecnica, parches, espaguetti code. Todo desde la maestria de un ingeniero de softawre que siempre utilizara las mejores practicas de desarrollo.

# Web3

Implementar funciones en web3 suele crear bugs para el usuario, ejemplo: si conecta una wallet y luego cambia a otra wallet suele romper algo, asi que cada funcion implementada en la UI debe ser pensada para que todo quede perfecto, no solo solucionar una accion o funcion, si no que no altere nada mas en la dapp, lo que dije es solo un ejemplo de muchos, ya que normalmente si un dato debe mostrase, otro dato dejara de mostrarse, bien sea por temas de Apis, RCPs, etc que dejan de funcionar por saturacion de peticiones, a ver tomate estos ejemplos como solo ejemplos de miles, lo que trato de decir es que siempre piensa como ingeniero de software e implementando todo un sistema sin fallos en web3, ya que normalmente los agentes suelen arreglar algo a la ligera pero rompen otra cosa, asi lo tengamos establecido en las reglas.

# Idioma en UI

A pesar de que nuestras conversaciones sean en español, todo el código, textos de la interfaz (UI) y documentación del proyecto deben ser escritos siempre y estrictamente en inglés nativo. No introduzcas texto en español en la base de código.