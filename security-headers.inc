add_header X-Content-Type-Options "nosniff" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header Referrer-Policy "strict-origin" always;
# frame-ancestors is not enforced inside a Report-Only policy, so framing is blocked by the two
# headers below. The rest of the CSP stays Report-Only until it has been tested against the BFF.
add_header Content-Security-Policy "frame-ancestors 'none'" always;
add_header X-Frame-Options "DENY" always;
add_header Content-Security-Policy-Report-Only "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'" always;
