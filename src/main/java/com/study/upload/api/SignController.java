package com.study.upload.api;

import org.apache.tomcat.util.codec.binary.Base64;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;

/**
 * s3请求签名
 */
@RestController
public class SignController {

    private static final String HMAC_SHA1_ALGORITHM = "HmacSHA1";

    @RequestMapping("/signv4_auth")
    public String getSignv4Auth(HttpServletRequest request) throws ServletException {
        String data = request.getParameter("to_sign");

        if (StringUtils.isEmpty(data)) {
            return "Invalid data: 'to_sign' parameter not informed";
        } else {
            return calculateRFC2104HMAC(data, "C4UB88kkbR5QQhBEnKau2zUmkqxdttQOYSexIcDg");
        }
    }

    /**
     * http://docs.aws.amazon.com/AmazonSimpleDB/latest/DeveloperGuide/HMACAuth.html#AuthJavaSampleHMACSignature
     * <p>
     * Computes RFC 2104-compliant HMAC signature.
     *
     * @param data The data to be signed.
     * @param key  The signing key.
     * @return The Base64-encoded RFC 2104-compliant HMAC signature.
     * @throws ServletException
     * @throws java.security.SignatureException when signature generation fails
     */
    public static String calculateRFC2104HMAC(String data, String key) throws ServletException {
        String result;
        try {
            // get an hmac_sha1 key from the raw key bytes
            SecretKeySpec signingKey = new SecretKeySpec(key.getBytes(), HMAC_SHA1_ALGORITHM);

            // get an hmac_sha1 Mac instance and initialize with the signing key
            Mac mac = Mac.getInstance(HMAC_SHA1_ALGORITHM);
            mac.init(signingKey);

            // compute the hmac on input data bytes
            byte[] rawHmac = mac.doFinal(data.getBytes());

            // base64-encode the hmac
            result = new String(Base64.encodeBase64(rawHmac));
        } catch (Exception e) {
            throw new ServletException("Failed to generate HMAC: " + e.getMessage());
        }
        return result;
    }
}
