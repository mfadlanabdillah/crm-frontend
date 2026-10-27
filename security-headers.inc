add_header X-Content-Type-Options "nosniff" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header Referrer-Policy "strict-origin" always;
# Report-Only dulu; ubah ke Content-Security-Policy setelah diuji dengan BFF.
add_header Content-Security-Policy-Report-Only "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'" always;
